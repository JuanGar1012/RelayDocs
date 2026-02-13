package com.relaydocs.documentservice.events;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsumedEventRepository extends JpaRepository<ConsumedEventEntity, Long> {

    long countByConsumerNameAndEventId(String consumerName, String eventId);
}
