package com.relaydocs.documentservice.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@Component
@ConditionalOnProperty(name = "relaydocs.events.kafka.consumer-enabled", havingValue = "true")
public class KafkaDomainEventConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(KafkaDomainEventConsumer.class);

    private final ObjectMapper objectMapper;
    private final EventConsumptionRecorder eventConsumptionRecorder;
    private final RelayEventProperties relayEventProperties;

    public KafkaDomainEventConsumer(
            ObjectMapper objectMapper,
            EventConsumptionRecorder eventConsumptionRecorder,
            RelayEventProperties relayEventProperties
    ) {
        this.objectMapper = objectMapper;
        this.eventConsumptionRecorder = eventConsumptionRecorder;
        this.relayEventProperties = relayEventProperties;
    }

    @KafkaListener(
            topics = "#{@relayEventProperties.kafkaTopic}",
            groupId = "#{@relayEventProperties.kafkaConsumerGroupId}"
    )
    public void handleEvent(String rawEvent) {
        JsonNode root = parse(rawEvent);

        String eventType = requireText(root, "eventType");
        String aggregateId = requireText(root, "aggregateId");
        String eventId = textOrNull(root, "eventId");
        if (eventId == null || eventId.isBlank()) {
            eventId = sha256(rawEvent);
        }

        Instant occurredAt = parseInstant(textOrNull(root, "occurredAt"));

        boolean processed = eventConsumptionRecorder.recordIfNew(
                relayEventProperties.getKafkaConsumerName(),
                eventId,
                eventType,
                aggregateId,
                occurredAt
        );

        if (!processed) {
            LOGGER.debug("Skipping duplicate domain event. consumer={}, eventId={}",
                    relayEventProperties.getKafkaConsumerName(),
                    eventId);
            return;
        }

        LOGGER.debug("Processed domain event. consumer={}, eventType={}, aggregateId={}, eventId={}",
                relayEventProperties.getKafkaConsumerName(),
                eventType,
                aggregateId,
                eventId);
    }

    private JsonNode parse(String rawEvent) {
        try {
            return objectMapper.readTree(rawEvent);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Invalid event payload", exception);
        }
    }

    private String requireText(JsonNode root, String fieldName) {
        String value = textOrNull(root, fieldName);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required event field: " + fieldName);
        }
        return value;
    }

    private String textOrNull(JsonNode root, String fieldName) {
        JsonNode node = root.path(fieldName);
        if (node.isMissingNode() || node.isNull() || !node.isTextual()) {
            return null;
        }
        return node.asText();
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Instant.parse(value);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hashBytes.length * 2);
            for (byte hashByte : hashBytes) {
                builder.append(String.format("%02x", hashByte));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", exception);
        }
    }
}
