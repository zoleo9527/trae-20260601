package routes

import (
	"museum-education/internal/controllers"
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/gorm"
)

func Setup(app *fiber.App, db *gorm.DB) {
	idempotentService := services.NewIdempotentService(db)

	courseService := services.NewCourseService(db)
	courseController := controllers.NewCourseController(courseService)

	instructorService := services.NewInstructorService(db)
	instructorController := controllers.NewInstructorController(instructorService)

	materialService := services.NewMaterialService(db)
	materialController := controllers.NewMaterialController(materialService)

	signupService := services.NewSignupService(db, idempotentService)
	signupController := controllers.NewSignupController(signupService)

	checkinService := services.NewCheckinService(db, idempotentService)
	checkinController := controllers.NewCheckinController(checkinService)

	safetyService := services.NewSafetyService(db, idempotentService)
	safetyController := controllers.NewSafetyController(safetyService)

	exceptionService := services.NewExceptionService(db)
	exceptionController := controllers.NewExceptionController(exceptionService)

	traceService := services.NewTraceService(db)
	traceController := controllers.NewTraceController(traceService)

	auditService := services.NewAuditService(db)
	auditController := controllers.NewAuditController(auditService)

	api := app.Group("/api")

	courses := api.Group("/courses")
	courses.Post("/", courseController.CreateCourse)
	courses.Get("/", courseController.GetCourses)
	courses.Get("/:id", courseController.GetCourseByID)
	courses.Put("/:id", courseController.UpdateCourse)
	courses.Delete("/:id", courseController.DeleteCourse)

	instructors := api.Group("/instructors")
	instructors.Post("/", instructorController.CreateInstructor)
	instructors.Get("/", instructorController.GetInstructors)
	instructors.Get("/:id", instructorController.GetInstructorByID)
	instructors.Put("/:id", instructorController.UpdateInstructor)
	instructors.Post("/schedule", instructorController.ScheduleCourse)
	instructors.Get("/:instructor_id/schedule", instructorController.GetInstructorSchedule)
	instructors.Get("/course/:course_id/schedule", instructorController.GetCourseSchedule)

	materials := api.Group("/materials")
	materials.Post("/", materialController.CreateMaterial)
	materials.Get("/course/:course_id", materialController.GetMaterialsByCourse)
	materials.Get("/course/:course_id/list", materialController.GetMaterialList)
	materials.Get("/:id", materialController.GetMaterialByID)
	materials.Put("/:id", materialController.UpdateMaterial)
	materials.Delete("/:id", materialController.DeleteMaterial)

	signups := api.Group("/signups")
	signups.Post("/", signupController.CreateSignup)
	signups.Get("/", signupController.GetSignupsByCourse)
	signups.Get("/:id", signupController.GetSignupByID)
	signups.Get("/course/:course_id", signupController.GetSignupsByCourse)
	signups.Get("/student/:student_id", signupController.GetSignupsByStudent)
	signups.Put("/:id", signupController.UpdateSignup)
	signups.Post("/:id/cancel", signupController.CancelSignup)

	checkins := api.Group("/checkins")
	checkins.Post("/", checkinController.CreateCheckin)
	checkins.Get("/course/:course_id", checkinController.GetCheckinsByCourse)
	checkins.Get("/:id", checkinController.GetCheckinByID)
	checkins.Put("/:id", checkinController.UpdateCheckin)
	checkins.Post("/:id/reject", checkinController.RejectCheckin)
	checkins.Post("/backfill", checkinController.BackfillCheckin)

	safety := api.Group("/safety")
	safety.Post("/", safetyController.CreateSafetyRecord)
	safety.Get("/course/:course_id", safetyController.GetSafetyRecordsByCourse)
	safety.Get("/checkin/:checkin_id", safetyController.GetSafetyRecordsByCheckin)
	safety.Get("/:id", safetyController.GetSafetyRecordByID)
	safety.Put("/:id", safetyController.UpdateSafetyRecord)

	exceptions := api.Group("/exceptions")
	exceptions.Post("/", exceptionController.CreateException)
	exceptions.Get("/open", exceptionController.GetOpenExceptions)
	exceptions.Get("/course/:course_id", exceptionController.GetExceptionsByCourse)
	exceptions.Get("/checkin/:checkin_id", exceptionController.GetExceptionsByCheckin)
	exceptions.Get("/:id", exceptionController.GetExceptionByID)
	exceptions.Put("/:id/resolve", exceptionController.ResolveException)

	trace := api.Group("/trace")
	trace.Get("/checkin/:checkin_id", traceController.GetFullTrace)
	trace.Get("/course/:course_id", traceController.GetCourseTrace)

	audit := api.Group("/audit")
	audit.Get("/", auditController.GetAuditLogs)
	audit.Get("/:id", auditController.GetAuditLogByID)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
}
