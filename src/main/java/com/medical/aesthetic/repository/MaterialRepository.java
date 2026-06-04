package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.Material;
import com.medical.aesthetic.enums.MaterialStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByStatus(MaterialStatus status);

    List<Material> findByCategory(String category);

    @Query("SELECT m FROM Material m WHERE m.name LIKE %:keyword% OR m.category LIKE %:keyword%")
    List<Material> search(@Param("keyword") String keyword);
}
