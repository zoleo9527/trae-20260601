package com.eyeclinic.surgerycenter.config;

import com.eyeclinic.surgerycenter.entity.Patient;
import com.eyeclinic.surgerycenter.entity.User;
import com.eyeclinic.surgerycenter.enums.RoleType;
import com.eyeclinic.surgerycenter.repository.PatientRepository;
import com.eyeclinic.surgerycenter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            initUsers();
        }
        if (patientRepository.count() == 0) {
            initPatients();
        }
    }

    private void initUsers() {
        log.info("初始化用户数据...");

        User receptionist1 = new User();
        receptionist1.setUsername("reception1");
        receptionist1.setRealName("张小迎");
        receptionist1.setRole(RoleType.RECEPTIONIST);
        receptionist1.setPhone("13800000001");
        receptionist1.setDepartment("前台接待");
        userRepository.save(receptionist1);

        User receptionist2 = new User();
        receptionist2.setUsername("reception2");
        receptionist2.setRealName("李接待");
        receptionist2.setRole(RoleType.RECEPTIONIST);
        receptionist2.setPhone("13800000002");
        receptionist2.setDepartment("前台接待");
        userRepository.save(receptionist2);

        User specialist1 = new User();
        specialist1.setUsername("doctor1");
        specialist1.setRealName("王医生");
        specialist1.setRole(RoleType.SPECIALIST);
        specialist1.setPhone("13900000001");
        specialist1.setDepartment("眼科检查室");
        userRepository.save(specialist1);

        User specialist2 = new User();
        specialist2.setUsername("doctor2");
        specialist2.setRealName("刘医师");
        specialist2.setRole(RoleType.SPECIALIST);
        specialist2.setPhone("13900000002");
        specialist2.setDepartment("眼科检查室");
        userRepository.save(specialist2);

        User specialist3 = new User();
        specialist3.setUsername("surgeon1");
        specialist3.setRealName("陈主刀");
        specialist3.setRole(RoleType.SPECIALIST);
        specialist3.setPhone("13900000003");
        specialist3.setDepartment("手术医师");
        userRepository.save(specialist3);

        User supervisor1 = new User();
        supervisor1.setUsername("admin1");
        supervisor1.setRealName("赵主任");
        supervisor1.setRole(RoleType.SUPERVISOR);
        supervisor1.setPhone("13700000001");
        supervisor1.setDepartment("医务科");
        userRepository.save(supervisor1);

        User supervisor2 = new User();
        supervisor2.setUsername("admin2");
        supervisor2.setRealName("孙主管");
        supervisor2.setRole(RoleType.SUPERVISOR);
        supervisor2.setPhone("13700000002");
        supervisor2.setDepartment("医务科");
        userRepository.save(supervisor2);

        log.info("用户数据初始化完成，共创建 {} 个用户", userRepository.count());
    }

    private void initPatients() {
        log.info("初始化患者数据...");

        String[] names = {"张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"};
        String[] genders = {"男", "女"};

        for (int i = 0; i < names.length; i++) {
            Patient patient = new Patient();
            patient.setPatientNo(String.format("P%06d", 2026001 + i));
            patient.setName(names[i]);
            patient.setGender(genders[i % 2]);
            patient.setBirthDate(LocalDate.of(1970 + (i * 5), (i % 12) + 1, (i % 28) + 1));
            patient.setIdCard(String.format("110101%d%04d%04d",
                    1970 + (i * 5), (i % 12) + 1, (i % 28) + 1));
            patient.setPhone(String.format("136%08d", 10000000 + i));
            patient.setAddress("北京市朝阳区XX街道XX号");
            patient.setAge(2026 - (1970 + i * 5));
            if (i % 3 == 0) {
                patient.setMedicalHistory("高血压病史5年，规律服药");
            }
            if (i % 4 == 0) {
                patient.setAllergyHistory("青霉素过敏");
            }
            patientRepository.save(patient);
        }

        log.info("患者数据初始化完成，共创建 {} 个患者", patientRepository.count());
    }
}
