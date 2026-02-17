package com.relaydocs.documentservice.events;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest(properties = {
        "relaydocs.events.kafka.consumer-enabled=true",
        "relaydocs.events.kafka-topic=relaydocs.it.events",
        "relaydocs.events.kafka-consumer-group-id=relaydocs-document-service-it",
        "relaydocs.events.kafka-consumer-name=document-service-it",
        "spring.kafka.consumer.auto-offset-reset=earliest",
        "spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer",
        "spring.kafka.consumer.value-deserializer=org.apache.kafka.common.serialization.StringDeserializer",
        "spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer",
        "spring.kafka.producer.value-serializer=org.apache.kafka.common.serialization.StringSerializer"
})
@Testcontainers(disabledWithoutDocker = true)
class KafkaDomainEventConsumerIntegrationTest {

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(
            DockerImageName.parse("apache/kafka-native:3.8.0")
                    .asCompatibleSubstituteFor("confluentinc/cp-kafka")
    );

    @DynamicPropertySource
    static void kafkaProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
    }

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ConsumedEventRepository consumedEventRepository;

    @AfterEach
    void cleanUp() {
        consumedEventRepository.deleteAll();
    }

    @Test
    void consumesEventFromBrokerAndStoresRecord() throws Exception {
        String eventId = UUID.randomUUID().toString();
        String payload = """
                {
                  "eventId": "%s",
                  "eventType": "document.created",
                  "aggregateId": "42",
                  "occurredAt": "%s",
                  "payload": {
                    "documentId": 42
                  }
                }
                """.formatted(eventId, Instant.now());

        kafkaTemplate.send("relaydocs.it.events", "42", payload).get(10, TimeUnit.SECONDS);

        await()
                .atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(
                        consumedEventRepository.countByConsumerNameAndEventId("document-service-it", eventId)
                ).isEqualTo(1));
    }

    @Test
    void ignoresDuplicateEventIdFromBroker() throws Exception {
        String eventId = UUID.randomUUID().toString();
        String payload = """
                {
                  "eventId": "%s",
                  "eventType": "document.updated",
                  "aggregateId": "99",
                  "payload": {
                    "documentId": 99
                  }
                }
                """.formatted(eventId);

        kafkaTemplate.send("relaydocs.it.events", "99", payload).get(10, TimeUnit.SECONDS);
        kafkaTemplate.send("relaydocs.it.events", "99", payload).get(10, TimeUnit.SECONDS);

        await()
                .atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(
                        consumedEventRepository.countByConsumerNameAndEventId("document-service-it", eventId)
                ).isEqualTo(1));
    }
}
