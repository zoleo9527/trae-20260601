package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByActiveTrue();

    List<Project> findByCategory(String category);
}
