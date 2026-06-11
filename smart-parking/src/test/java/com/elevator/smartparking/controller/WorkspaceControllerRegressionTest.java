package com.elevator.smartparking.controller;

import com.elevator.smartparking.dto.RescueTodoItemVO;
import com.elevator.smartparking.dto.WorkspaceVO;
import com.elevator.smartparking.entity.*;
import com.elevator.smartparking.repository.*;
import com.elevator.smartparking.service.RoleActionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WorkspaceController.class)
@DisplayName("工作台可见性回归测试 - 覆盖4个核心场景")
class WorkspaceControllerRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoleActionService roleActionService;

    @MockBean
    private FaultReportRepository faultReportRepository;

    @MockBean
    private EntrapmentRescueRepository entrapmentRescueRepository;

    @MockBean
    private ElevatorRepository elevatorRepository;

    @MockBean
    private SysUserRepository sysUserRepository;

    private ObjectMapper objectMapper;

    private static final Long CURRENT_TECHNICIAN_ID = 101L;
    private static final Long OTHER_TECHNICIAN_ID = 102L;
    private static final Long ELEVATOR_ID = 201L;
    private static final Long FAULT_REPORT_ID = 301L;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        when(roleActionService.getRoleName(UserRole.MAINTENANCE_TECHNICIAN)).thenReturn("维保技师");
        when(roleActionService.getFaultTodoStatuses(UserRole.MAINTENANCE_TECHNICIAN))
                .thenReturn(List.of(FaultStatus.PROCESSING));
        when(roleActionService.getRescueTodoStatuses(UserRole.MAINTENANCE_TECHNICIAN))
                .thenReturn(List.of(RescueStatus.PENDING_RESCUE, RescueStatus.RESCUING, RescueStatus.RESCUED));
        when(roleActionService.getFaultNextActions(any(), any()))
                .thenReturn(new ArrayList<>());
        when(roleActionService.getRescueNextActions(any(), any()))
                .thenReturn(new ArrayList<>());

        when(elevatorRepository.findById(ELEVATOR_ID))
                .thenReturn(Optional.of(buildElevator(ELEVATOR_ID)));
        when(sysUserRepository.findById(CURRENT_TECHNICIAN_ID))
                .thenReturn(Optional.of(buildUser(CURRENT_TECHNICIAN_ID, "张工")));
        when(sysUserRepository.findById(OTHER_TECHNICIAN_ID))
                .thenReturn(Optional.of(buildUser(OTHER_TECHNICIAN_ID, "李工")));
    }

    @Test
    @DisplayName("回归场景1：故障PENDING不应返回给维保技师 - RoleActionService 限定技师只看 PROCESSING")
    void faultPendingStatus_shouldNotBeVisibleToTechnician() throws Exception {
        FaultReport pendingFault = buildFaultReport(1L, "F001", FaultStatus.PENDING, null);
        FaultReport myProcessingFault = buildFaultReport(2L, "F002", FaultStatus.PROCESSING, CURRENT_TECHNICIAN_ID);
        FaultReport otherProcessingFault = buildFaultReport(3L, "F003", FaultStatus.PROCESSING, OTHER_TECHNICIAN_ID);

        when(faultReportRepository.findAll()).thenReturn(List.of(pendingFault, myProcessingFault, otherProcessingFault));
        when(faultReportRepository.findByStatusInAndHandlerIdOrderByCreateTimeDesc(
                eq(List.of(FaultStatus.PROCESSING)), eq(CURRENT_TECHNICIAN_ID)
        )).thenReturn(List.of(myProcessingFault));

        when(entrapmentRescueRepository.findAll()).thenReturn(Collections.emptyList());

        WorkspaceVO vo = callWorkspaceApi(UserRole.MAINTENANCE_TECHNICIAN, CURRENT_TECHNICIAN_ID, "张工");

        assertNotNull(vo);

        assertEquals(1, vo.getFaultTodoList().size(),
                "当前技师只能看到指派给自己的 PROCESSING 故障");
        assertEquals("F002", vo.getFaultTodoList().get(0).getReportNo());

        List<String> visibleReportNos = vo.getFaultTodoList().stream()
                .map(f -> f.getReportNo()).toList();
        assertFalse(visibleReportNos.contains("F001"),
                "PENDING 状态的故障 F001 不应出现在维保技师待办中（PENDING 属客服/主管");
        assertFalse(visibleReportNos.contains("F003"),
                "指派给其他技师的故障 F003 不应出现在当前技师待办中");

        assertEquals(0, vo.getFaultTodoSummary().getPending(),
                "技师待办统计中 pending 应为 0（看不到 PENDING 状态");
        assertEquals(1, vo.getFaultTodoSummary().getProcessing());
    }

    @Test
    @DisplayName("回归场景2：PENDING_RESCUE 且 rescuerId 为空 - 应可见（可抢单")
    void pendingRescueWithNullRescuerId_shouldBeVisibleToTechnician() throws Exception {
        EntrapmentRescue unassignedRescue = buildRescue(1L, "R001", RescueStatus.PENDING_RESCUE, null, FAULT_REPORT_ID);
        FaultReport relatedFault = buildFaultReport(FAULT_REPORT_ID, "F001", FaultStatus.PROCESSING, OTHER_TECHNICIAN_ID);
        relatedFault.setRemark("3楼按键失灵，老人小孩被困");

        when(entrapmentRescueRepository.findAll()).thenReturn(List.of(unassignedRescue));
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdIsNullOrderByCreateTimeDesc(
                eq(List.of(RescueStatus.PENDING_RESCUE))
        )).thenReturn(List.of(unassignedRescue));
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdOrderByCreateTimeDesc(
                anyList(), eq(CURRENT_TECHNICIAN_ID)
        )).thenReturn(Collections.emptyList());

        when(faultReportRepository.findAll()).thenReturn(Collections.emptyList());
        when(faultReportRepository.findById(FAULT_REPORT_ID)).thenReturn(Optional.of(relatedFault));

        WorkspaceVO vo = callWorkspaceApi(UserRole.MAINTENANCE_TECHNICIAN, CURRENT_TECHNICIAN_ID, "张工");

        assertEquals(1, vo.getRescueTodoList().size(),
                "未指派的 PENDING_RESCUE 工单应出现在技师待办中（可抢单");
        RescueTodoItemVO item = vo.getRescueTodoList().get(0);
        assertEquals("R001", item.getRescueNo());
        assertNull(item.getRescuerId(), "rescuerId 为空，属于未指派");

        assertNotNull(item.getFaultStatus(), "关联故障状态字段应存在");
        assertEquals("PROCESSING", item.getFaultStatus(), "关联故障状态应为 PROCESSING");
        assertEquals("处理中", item.getFaultStatusText(), "关联故障状态文本应为处理中");
        assertNotNull(item.getFaultRemark(), "关联故障备注字段应存在");
        assertEquals("3楼按键失灵，老人小孩被困", item.getFaultRemark(),
                "关联故障备注应正确返回，用于处理上下文参考");
    }

    @Test
    @DisplayName("回归场景3：PENDING_RESCUE 且 rescuerId == 当前技师 - 应可见（已指派给自己")
    void pendingRescueAssignedToCurrentTechnician_shouldBeVisible() throws Exception {
        EntrapmentRescue assignedToMe = buildRescue(1L, "R001", RescueStatus.PENDING_RESCUE, CURRENT_TECHNICIAN_ID, FAULT_REPORT_ID);
        FaultReport relatedFault = buildFaultReport(FAULT_REPORT_ID, "F001", FaultStatus.TRANSFERRED_TO_RESCUE, OTHER_TECHNICIAN_ID);
        relatedFault.setRemark("已转困人处置，等待救援");

        when(entrapmentRescueRepository.findAll()).thenReturn(List.of(assignedToMe));
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdIsNullOrderByCreateTimeDesc(
                eq(List.of(RescueStatus.PENDING_RESCUE))
        )).thenReturn(Collections.emptyList());
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdOrderByCreateTimeDesc(
                anyList(), eq(CURRENT_TECHNICIAN_ID)
        )).thenReturn(List.of(assignedToMe));

        when(faultReportRepository.findAll()).thenReturn(Collections.emptyList());
        when(faultReportRepository.findById(FAULT_REPORT_ID)).thenReturn(Optional.of(relatedFault));

        WorkspaceVO vo = callWorkspaceApi(UserRole.MAINTENANCE_TECHNICIAN, CURRENT_TECHNICIAN_ID, "张工");

        assertEquals(1, vo.getRescueTodoList().size(),
                "指派给自己的 PENDING_RESCUE 工单应可见");
        RescueTodoItemVO item = vo.getRescueTodoList().get(0);
        assertEquals(CURRENT_TECHNICIAN_ID, item.getRescuerId());
        assertEquals("张工", item.getRescuerName());

        assertEquals("TRANSFERRED_TO_RESCUE", item.getFaultStatus(),
                "关联故障状态应为 TRANSFERRED_TO_RESCUE");
        assertEquals("已转困人", item.getFaultStatusText());
        assertEquals("已转困人处置，等待救援", item.getFaultRemark(),
                "关联故障备注应正确返回");
    }

    @Test
    @DisplayName("回归场景4：PENDING_RESCUE 且 rescuerId == 其他技师 - 应不可见")
    void pendingRescueAssignedToOtherTechnician_shouldNotBeVisible() throws Exception {
        EntrapmentRescue assignedToMe = buildRescue(1L, "R001", RescueStatus.PENDING_RESCUE, CURRENT_TECHNICIAN_ID, null);
        EntrapmentRescue assignedToOther = buildRescue(2L, "R002", RescueStatus.PENDING_RESCUE, OTHER_TECHNICIAN_ID, null);
        EntrapmentRescue unassigned = buildRescue(3L, "R003", RescueStatus.PENDING_RESCUE, null, null);
        EntrapmentRescue rescuingMine = buildRescue(4L, "R004", RescueStatus.RESCUING, CURRENT_TECHNICIAN_ID, null);
        EntrapmentRescue rescuingOther = buildRescue(5L, "R005", RescueStatus.RESCUING, OTHER_TECHNICIAN_ID, null);
        EntrapmentRescue rescuedMine = buildRescue(6L, "R006", RescueStatus.RESCUED, CURRENT_TECHNICIAN_ID, null);

        List<EntrapmentRescue> allRescues = List.of(
                assignedToMe, assignedToOther, unassigned, rescuingMine, rescuingOther, rescuedMine
        );

        when(entrapmentRescueRepository.findAll()).thenReturn(allRescues);
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdIsNullOrderByCreateTimeDesc(
                eq(List.of(RescueStatus.PENDING_RESCUE))
        )).thenReturn(List.of(unassigned));
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdOrderByCreateTimeDesc(
                anyList(), eq(CURRENT_TECHNICIAN_ID)
        )).thenReturn(List.of(assignedToMe, rescuingMine, rescuedMine));

        when(faultReportRepository.findAll()).thenReturn(Collections.emptyList());

        WorkspaceVO vo = callWorkspaceApi(UserRole.MAINTENANCE_TECHNICIAN, CURRENT_TECHNICIAN_ID, "张工");

        List<String> visibleNos = vo.getRescueTodoList().stream()
                .map(RescueTodoItemVO::getRescueNo).sorted().toList();
        List<String> expectedNos = List.of("R001", "R003", "R004", "R006");

        assertEquals(expectedNos.size(), visibleNos.size(),
                "应返回 4 条可见工单");
        assertEquals(expectedNos, visibleNos,
                "应可见: R001(指派给自己的待救援)、R003(未指派可抢单)、R004(自己救援中)、R006(自己已解救)");
        assertFalse(visibleNos.contains("R002"),
                "R002 指派给其他技师，不可见");
        assertFalse(visibleNos.contains("R005"),
                "R005 其他技师救援中，不可见");

        assertEquals(2, vo.getRescueTodoSummary().getPendingRescue(),
                "统计待救援: R001(指派给自己) + R003(未指派) = 2 条可见");
    }

    @Test
    @DisplayName("回归场景5：客服视图 - PENDING 故障和 PENDING_RESCUE 困人均可见，不受 handlerId/rescuerId 限制")
    void customerServiceView_shouldSeeAllPending() throws Exception {
        when(roleActionService.getRoleName(UserRole.CUSTOMER_SERVICE)).thenReturn("客服");
        when(roleActionService.getFaultTodoStatuses(UserRole.CUSTOMER_SERVICE))
                .thenReturn(List.of(FaultStatus.PENDING, FaultStatus.TRANSFERRED_TO_RESCUE));
        when(roleActionService.getRescueTodoStatuses(UserRole.CUSTOMER_SERVICE))
                .thenReturn(List.of(RescueStatus.PENDING_RESCUE));

        FaultReport pending1 = buildFaultReport(1L, "F001", FaultStatus.PENDING, null);
        FaultReport pending2 = buildFaultReport(2L, "F002", FaultStatus.PENDING, CURRENT_TECHNICIAN_ID);
        FaultReport transferred = buildFaultReport(3L, "F003", FaultStatus.TRANSFERRED_TO_RESCUE, OTHER_TECHNICIAN_ID);
        when(faultReportRepository.findAll()).thenReturn(List.of(pending1, pending2, transferred));
        when(faultReportRepository.findByStatusInOrderByCreateTimeDesc(
                eq(List.of(FaultStatus.PENDING, FaultStatus.TRANSFERRED_TO_RESCUE))
        )).thenReturn(List.of(pending1, pending2, transferred));

        EntrapmentRescue pendingRescue1 = buildRescue(1L, "R001", RescueStatus.PENDING_RESCUE, null, null);
        EntrapmentRescue pendingRescue2 = buildRescue(2L, "R002", RescueStatus.PENDING_RESCUE, OTHER_TECHNICIAN_ID, null);
        when(entrapmentRescueRepository.findAll()).thenReturn(List.of(pendingRescue1, pendingRescue2));
        when(entrapmentRescueRepository.findByStatusInOrderByCreateTimeDesc(
                eq(List.of(RescueStatus.PENDING_RESCUE))
        )).thenReturn(List.of(pendingRescue1, pendingRescue2));

        WorkspaceVO vo = callWorkspaceApi(UserRole.CUSTOMER_SERVICE, 1L, "王客服");

        assertEquals(3, vo.getFaultTodoList().size(),
                "客服应看到所有 PENDING 和 TRANSFERRED_TO_RESCUE 故障，共 3 条");
        assertEquals(2, vo.getRescueTodoList().size(),
                "客服应看到所有 PENDING_RESCUE 困人工单，不受 rescuerId 限制，共 2 条");
    }

    @Test
    @DisplayName("回归场景6：关联故障字段完整性断言 - 所有字段正确填充")
    void rescueTodoItem_shouldHaveCompleteFaultRelationFields() throws Exception {
        EntrapmentRescue rescue = buildRescue(1L, "R001", RescueStatus.PENDING_RESCUE, null, FAULT_REPORT_ID);
        FaultReport relatedFault = buildFaultReport(FAULT_REPORT_ID, "F-BJ-2026-0601", FaultStatus.TRANSFERRED_TO_RESCUE, CURRENT_TECHNICIAN_ID);
        relatedFault.setRemark("电梯停在3楼，门打不开，有3人被困，其中1个小孩在哭");

        when(entrapmentRescueRepository.findAll()).thenReturn(List.of(rescue));
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdIsNullOrderByCreateTimeDesc(
                eq(List.of(RescueStatus.PENDING_RESCUE))
        )).thenReturn(List.of(rescue));
        when(entrapmentRescueRepository.findByStatusInAndRescuerIdOrderByCreateTimeDesc(
                anyList(), eq(CURRENT_TECHNICIAN_ID)
        )).thenReturn(Collections.emptyList());

        when(faultReportRepository.findAll()).thenReturn(Collections.emptyList());
        when(faultReportRepository.findById(FAULT_REPORT_ID)).thenReturn(Optional.of(relatedFault));

        WorkspaceVO vo = callWorkspaceApi(UserRole.MAINTENANCE_TECHNICIAN, CURRENT_TECHNICIAN_ID, "张工");

        RescueTodoItemVO item = vo.getRescueTodoList().get(0);

        assertNotNull(item.getFaultReportId(), "faultReportId 不应为 null");
        assertEquals(FAULT_REPORT_ID, item.getFaultReportId());
        assertNotNull(item.getFaultReportNo(), "faultReportNo 不应为 null");
        assertEquals("F-BJ-2026-0601", item.getFaultReportNo());
        assertNotNull(item.getFaultStatus(), "faultStatus 不应为 null");
        assertEquals("TRANSFERRED_TO_RESCUE", item.getFaultStatus());
        assertNotNull(item.getFaultStatusText(), "faultStatusText 不应为 null");
        assertEquals("已转困人", item.getFaultStatusText());
        assertNotNull(item.getFaultRemark(), "faultRemark 不应为 null");
        assertEquals("电梯停在3楼，门打不开，有3人被困，其中1个小孩在哭", item.getFaultRemark(),
                "faultRemark 应正确返回关联故障备注");
    }

    private WorkspaceVO callWorkspaceApi(UserRole role, Long userId, String userName) throws Exception {
        var requestBuilder = get("/api/workspace")
                .param("role", role.name())
                .contentType(MediaType.APPLICATION_JSON);

        if (userId != null) {
            requestBuilder.header("X-User-Id", String.valueOf(userId));
        }
        if (userName != null) {
            requestBuilder.header("X-User-Name", userName);
        }

        String response = mockMvc.perform(requestBuilder)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<String, Object> resultMap = objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});
        return objectMapper.convertValue(resultMap.get("data"), WorkspaceVO.class);
    }

    private FaultReport buildFaultReport(Long id, String reportNo, FaultStatus status, Long handlerId) {
        FaultReport f = new FaultReport();
        f.setId(id);
        f.setReportNo(reportNo);
        f.setElevatorId(ELEVATOR_ID);
        f.setStatus(status);
        f.setHandlerId(handlerId);
        f.setFaultType("门机故障");
        f.setFaultDescription("电梯门无法正常开关");
        f.setReporterName("李先生");
        f.setReporterPhone("13800138000");
        f.setHasEntrapment(false);
        f.setCreateTime(LocalDateTime.now());
        if (handlerId != null) {
            f.setAcceptTime(LocalDateTime.now());
        }
        return f;
    }

    private EntrapmentRescue buildRescue(Long id, String rescueNo, RescueStatus status, Long rescuerId, Long faultReportId) {
        EntrapmentRescue r = new EntrapmentRescue();
        r.setId(id);
        r.setRescueNo(rescueNo);
        r.setElevatorId(ELEVATOR_ID);
        r.setStatus(status);
        r.setRescuerId(rescuerId);
        r.setFaultReportId(faultReportId);
        r.setTrappedCount(2);
        r.setTrappedFloor("3楼");
        r.setReportTime(LocalDateTime.now());
        if (rescuerId != null) {
            r.setArrivalTime(LocalDateTime.now());
        }
        if (status == RescueStatus.RESCUED) {
            r.setRescuedTime(LocalDateTime.now());
        }
        return r;
    }

    private Elevator buildElevator(Long id) {
        Elevator e = new Elevator();
        e.setId(id);
        e.setElevatorNo("ELV-001");
        e.setBuildingNo("A座");
        return e;
    }

    private SysUser buildUser(Long id, String name) {
        SysUser u = new SysUser();
        u.setId(id);
        u.setName(name);
        u.setPhone("13800138" + String.format("%04d", id));
        u.setRole(UserRole.MAINTENANCE_TECHNICIAN);
        return u;
    }
}
