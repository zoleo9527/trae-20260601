package com.eyeclinic.surgerycenter.enums;

public enum SurgeryType {
    CATARACT("白内障手术", 30),
    LASIK("准分子激光手术", 45),
    ICL("ICL晶体植入", 60),
    GLAUCOMA("青光眼手术", 45),
    RETINA("视网膜手术", 90),
    PTERYGIUM("翼状胬肉手术", 25);

    private final String description;
    private final int durationMinutes;

    SurgeryType(String description, int durationMinutes) {
        this.description = description;
        this.durationMinutes = durationMinutes;
    }

    public String getDescription() {
        return description;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }
}
