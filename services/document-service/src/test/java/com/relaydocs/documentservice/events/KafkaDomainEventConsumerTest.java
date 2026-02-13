package com.relaydocs.documentservice.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KafkaDomainEventConsumerTest {

    @Test
    void handleEventUsesHashAsFallbackEventIdWhenMissing() {
        FakeEventConsumptionRecorder eventConsumptionRecorder = new FakeEventConsumptionRecorder(true);
        RelayEventProperties relayEventProperties = new RelayEventProperties();
        relayEventProperties.setKafkaConsumerName("document-service");
        KafkaDomainEventConsumer consumer = new KafkaDomainEventConsumer(
                new ObjectMapper(),
                eventConsumptionRecorder,
                relayEventProperties
        );
        String payload = """
                {
                  "eventType": "document.created",
                  "aggregateId": "1",
                  "payload": {
                    "documentId": 1
                  }
                }
                """;
        consumer.handleEvent(payload);

        assertThat(eventConsumptionRecorder.lastConsumerName).isEqualTo("document-service");
        assertThat(eventConsumptionRecorder.lastEventType).isEqualTo("document.created");
        assertThat(eventConsumptionRecorder.lastAggregateId).isEqualTo("1");
        assertThat(eventConsumptionRecorder.lastOccurredAt).isNull();
        assertThat(eventConsumptionRecorder.lastEventId).hasSize(64);
    }

    @Test
    void handleEventThrowsForInvalidPayload() {
        FakeEventConsumptionRecorder eventConsumptionRecorder = new FakeEventConsumptionRecorder(true);
        RelayEventProperties relayEventProperties = new RelayEventProperties();
        KafkaDomainEventConsumer consumer = new KafkaDomainEventConsumer(
                new ObjectMapper(),
                eventConsumptionRecorder,
                relayEventProperties
        );

        assertThatThrownBy(() -> consumer.handleEvent("{\"aggregateId\":\"1\"}"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Missing required event field");
        assertThat(eventConsumptionRecorder.invocationCount).isZero();
    }

    private static final class FakeEventConsumptionRecorder implements EventConsumptionRecorder {

        private final boolean returnValue;
        private int invocationCount = 0;
        private String lastConsumerName;
        private String lastEventId;
        private String lastEventType;
        private String lastAggregateId;
        private java.time.Instant lastOccurredAt;

        private FakeEventConsumptionRecorder(boolean returnValue) {
            this.returnValue = returnValue;
        }

        @Override
        public boolean recordIfNew(
                String consumerName,
                String eventId,
                String eventType,
                String aggregateId,
                java.time.Instant occurredAt
        ) {
            this.invocationCount += 1;
            this.lastConsumerName = consumerName;
            this.lastEventId = eventId;
            this.lastEventType = eventType;
            this.lastAggregateId = aggregateId;
            this.lastOccurredAt = occurredAt;
            return returnValue;
        }
    }
}
