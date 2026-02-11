package com.relaydocs.documentservice.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "relaydocs.events.kafka.enabled", havingValue = "true")
public class KafkaDomainEventPublisher implements DomainEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String topic;

    public KafkaDomainEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            RelayEventProperties relayEventProperties
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.topic = relayEventProperties.getKafkaTopic();
    }

    @Override
    public void publish(String eventType, String aggregateId, Map<String, Object> payload) {
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventType", eventType);
        envelope.put("aggregateId", aggregateId);
        envelope.put("occurredAt", Instant.now().toString());
        envelope.put("payload", payload);

        try {
            String serialized = objectMapper.writeValueAsString(envelope);
            kafkaTemplate.send(topic, aggregateId, serialized);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize domain event", exception);
        }
    }
}