package com.relaydocs.documentservice.events;

import java.time.Instant;

public interface EventConsumptionRecorder {

    boolean recordIfNew(
            String consumerName,
            String eventId,
            String eventType,
            String aggregateId,
            Instant occurredAt
    );
}
