package com.relaydocs.documentservice.events;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(ConsumedEventRecorder.class)
@ActiveProfiles("test")
class ConsumedEventRecorderTest {

    @Autowired
    private ConsumedEventRecorder consumedEventRecorder;

    @Autowired
    private ConsumedEventRepository consumedEventRepository;

    @Test
    void recordIfNewStoresEventOnlyOncePerConsumerAndEventId() {
        boolean first = consumedEventRecorder.recordIfNew(
                "document-service",
                "evt-1",
                "document.updated",
                "doc-10",
                Instant.parse("2026-02-12T00:00:00Z")
        );
        boolean duplicate = consumedEventRecorder.recordIfNew(
                "document-service",
                "evt-1",
                "document.updated",
                "doc-10",
                Instant.parse("2026-02-12T00:00:01Z")
        );

        assertThat(first).isTrue();
        assertThat(duplicate).isFalse();
        assertThat(consumedEventRepository.countByConsumerNameAndEventId("document-service", "evt-1")).isEqualTo(1L);
    }
}
