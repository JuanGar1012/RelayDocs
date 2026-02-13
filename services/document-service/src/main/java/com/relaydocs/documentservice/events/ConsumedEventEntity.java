package com.relaydocs.documentservice.events;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "consumed_events",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_consumed_events_consumer_event", columnNames = {"consumer_name", "event_id"})
        }
)
public class ConsumedEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "consumer_name", nullable = false, length = 120)
    private String consumerName;

    @Column(name = "event_id", nullable = false, length = 128)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 120)
    private String eventType;

    @Column(name = "aggregate_id", nullable = false, length = 120)
    private String aggregateId;

    @Column(name = "occurred_at")
    private Instant occurredAt;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    protected ConsumedEventEntity() {
    }

    public ConsumedEventEntity(
            String consumerName,
            String eventId,
            String eventType,
            String aggregateId,
            Instant occurredAt,
            Instant processedAt
    ) {
        this.consumerName = consumerName;
        this.eventId = eventId;
        this.eventType = eventType;
        this.aggregateId = aggregateId;
        this.occurredAt = occurredAt;
        this.processedAt = processedAt;
    }
}
