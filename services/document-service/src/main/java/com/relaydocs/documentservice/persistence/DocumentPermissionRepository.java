package com.relaydocs.documentservice.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentPermissionRepository extends JpaRepository<DocumentPermissionEntity, Long> {

    Optional<DocumentPermissionEntity> findByDocumentIdAndUserId(Long documentId, String userId);
}