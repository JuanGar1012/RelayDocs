package com.relaydocs.documentservice.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    @Query("""
            select distinct d
            from DocumentEntity d
            left join d.permissions p
            where d.owner.id = :userId or p.user.id = :userId
            order by d.id asc
            """)
    List<DocumentEntity> findVisibleDocuments(String userId);
}