package com.example.tailor.repository;

import com.example.tailor.entity.FabricCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FabricCardRepository extends JpaRepository<FabricCard, Long> {
    Optional<FabricCard> findByFabricCode(String fabricCode);
}