package com.relaydocs.documentservice.events;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class ConsumedEventRecorder implements EventConsumptionRecorder {

    private final ConsumedEventRepository consumedEventRepository;
    private final EntityManager entityManager;

    public ConsumedEventRecorder(ConsumedEventRepository consumedEventRepository, EntityManager entityManager) {
        this.consumedEventRepository = consumedEventRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    @Override
    public boolean recordIfNew(
            String consumerName,
            String eventId,
            String eventType,
            String aggregateId,
            Instant occurredAt
    ) {
        ConsumedEventEntity entity = new ConsumedEventEntity(
                consumerName,
                eventId,
                eventType,
                aggregateId,
                occurredAt,
                Instant.now()
        );

        try {
            consumedEventRepository.saveAndFlush(entity);
            return true;
        } catch (DataIntegrityViolationException ignored) {
            entityManager.clear();
            return false;
        }
    }
}
