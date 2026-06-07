package docs

import "github.com/swaggo/swag"

const docTemplate = `{
    "schemes": {{ marshal .Schemes }},
    "swagger": "2.0",
    "info": {
        "description": "{{escape .Description}}",
        "title": "{{.Title}}",
        "contact": {},
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "paths": {
        "/login": {
            "post": {
                "security": [],
                "description": "使用用户名和密码登录，返回JWT令牌和用户信息",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["认证"],
                "summary": "用户登录获取JWT令牌",
                "parameters": [
                    {
                        "description": "登录信息",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "username": {"type": "string"},
                                "password": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "登录成功，返回token和user",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "token": {"type": "string"},
                                "user": {
                                    "type": "object",
                                    "properties": {
                                        "id": {"type": "integer"},
                                        "username": {"type": "string"},
                                        "name": {"type": "string"},
                                        "role": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "400": {"description": "请求参数错误"},
                    "401": {"description": "用户名或密码错误"}
                }
            }
        },
        "/certificates": {
            "get": {
                "security": [{"BearerAuth": []}],
                "description": "获取所有检疫证明，可按状态筛选",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["检疫证明"],
                "summary": "查询检疫证明列表",
                "parameters": [
                    {
                        "type": "string",
                        "description": "状态筛选：pending/processing/approved/rejected/blocked",
                        "name": "status",
                        "in": "query"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "检疫证明列表",
                        "schema": {"type": "array"}
                    },
                    "500": {"description": "查询失败"}
                }
            },
            "post": {
                "security": [{"BearerAuth": []}],
                "description": "创建新的检疫证明。支持幂等提交：传入 X-Idempotency-Key 请求头，相同键重复提交返回首次创建结果（状态码201、JSON响应体、Content-Type完全一致）",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["检疫证明"],
                "summary": "创建新的检疫证明",
                "parameters": [
                    {
                        "type": "string",
                        "description": "幂等键，建议使用 UUID 或业务唯一标识，相同键重复提交返回首次结果",
                        "name": "X-Idempotency-Key",
                        "in": "header"
                    },
                    {
                        "description": "检疫证明信息",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "certificate_no": {"type": "string"},
                                "batch_no": {"type": "string"},
                                "product_name": {"type": "string"},
                                "weight": {"type": "number"},
                                "source": {"type": "string"},
                                "slaughter_date": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "创建成功",
                        "headers": {
                            "X-Idempotency-Hit": {
                                "type": "string",
                                "description": "幂等命中标记：仅重复提交时返回值为 true"
                            }
                        }
                    },
                    "400": {"description": "请求参数错误或编号已存在"}
                }
            }
        },
        "/certificates/{id}": {
            "get": {
                "security": [{"BearerAuth": []}],
                "description": "根据ID获取检疫证明的详细信息，包含历史备注和关联放行单",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["检疫证明"],
                "summary": "获取检疫证明详情",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "检疫证明ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {"description": "检疫证明详情"},
                    "404": {"description": "检疫证明不存在"}
                }
            }
        },
        "/certificates/{id}/status": {
            "put": {
                "security": [{"BearerAuth": []}],
                "description": "更新检疫证明的状态，支持状态流转：待处理→处理中→已通过/已驳回/已卡住，状态变更自动写入历史备注",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["检疫证明"],
                "summary": "更新检疫证明状态",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "检疫证明ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "状态信息",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "status": {"type": "string"},
                                "blocked_reason": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "更新成功，返回最新详情"},
                    "400": {"description": "请求参数错误"},
                    "404": {"description": "检疫证明不存在"}
                }
            }
        },
        "/certificates/{id}/notes": {
            "post": {
                "security": [{"BearerAuth": []}],
                "description": "为指定检疫证明添加操作备注，自动记录操作人和时间，显示在历史时间线中",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["检疫证明"],
                "summary": "为检疫证明添加备注",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "检疫证明ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "备注内容",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "content": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "添加成功"},
                    "400": {"description": "请求参数错误"},
                    "500": {"description": "添加失败"}
                }
            }
        },
        "/certificates/{id}/releases": {
            "post": {
                "security": [{"BearerAuth": []}],
                "description": "从检疫证明详情页创建关联的质检放行单，自动关联批次和产品信息。支持幂等提交：传入 X-Idempotency-Key 请求头，相同键重复提交返回首次创建结果（状态码201、JSON响应体、Content-Type完全一致）",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["检疫证明"],
                "summary": "从已通过的检疫证明创建关联放行单",
                "parameters": [
                    {
                        "type": "string",
                        "description": "幂等键，建议使用 UUID 或业务唯一标识，相同键重复提交返回首次结果",
                        "name": "X-Idempotency-Key",
                        "in": "header"
                    },
                    {
                        "type": "integer",
                        "description": "检疫证明ID（必须是已通过状态）",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "放行单信息",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "release_no": {"type": "string"},
                                "inspection_items": {"type": "string"},
                                "inspection_result": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "创建成功，返回放行单详情（含关联检疫证明）",
                        "headers": {
                            "X-Idempotency-Hit": {
                                "type": "string",
                                "description": "幂等命中标记：仅重复提交时返回值为 true"
                            }
                        }
                    },
                    "400": {"description": "请求参数错误或证明状态不允许"},
                    "404": {"description": "检疫证明不存在"}
                }
            }
        },
        "/releases": {
            "get": {
                "security": [{"BearerAuth": []}],
                "description": "获取所有质检放行单，可按状态筛选，包含关联的检疫证明信息",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["质检放行"],
                "summary": "查询质检放行单列表",
                "parameters": [
                    {
                        "type": "string",
                        "description": "状态筛选：pending/reviewing/passed/failed/on_hold/released",
                        "name": "status",
                        "in": "query"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "放行单列表",
                        "schema": {"type": "array"}
                    },
                    "500": {"description": "查询失败"}
                }
            },
            "post": {
                "security": [{"BearerAuth": []}],
                "description": "创建新的质检放行单，可关联已通过的检疫证明。支持幂等提交：传入 X-Idempotency-Key 请求头，相同键重复提交返回首次创建结果（状态码201、JSON响应体、Content-Type完全一致）",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["质检放行"],
                "summary": "创建新的质检放行单",
                "parameters": [
                    {
                        "type": "string",
                        "description": "幂等键，建议使用 UUID 或业务唯一标识，相同键重复提交返回首次结果",
                        "name": "X-Idempotency-Key",
                        "in": "header"
                    },
                    {
                        "description": "放行单信息",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "release_no": {"type": "string"},
                                "certificate_id": {"type": "integer"},
                                "batch_no": {"type": "string"},
                                "product_name": {"type": "string"},
                                "inspection_items": {"type": "string"},
                                "inspection_result": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {
                        "description": "创建成功",
                        "headers": {
                            "X-Idempotency-Hit": {
                                "type": "string",
                                "description": "幂等命中标记：仅重复提交时返回值为 true"
                            }
                        }
                    },
                    "400": {"description": "请求参数错误或编号已存在"}
                }
            }
        },
        "/releases/{id}": {
            "get": {
                "security": [{"BearerAuth": []}],
                "description": "根据ID获取质检放行单的详细信息，包含历史备注和关联的上游检疫证明状态",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["质检放行"],
                "summary": "获取质检放行单详情",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "放行单ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {"description": "放行单详情（含关联检疫证明）"},
                    "404": {"description": "放行单不存在"}
                }
            }
        },
        "/releases/{id}/status": {
            "put": {
                "security": [{"BearerAuth": []}],
                "description": "更新质检放行单的状态，支持状态流转：待处理→审核中→质检通过/质检不通过→待确认→已放行，状态变更自动写入历史备注",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["质检放行"],
                "summary": "更新质检放行单状态",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "放行单ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "状态信息",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "status": {"type": "string"},
                                "hold_reason": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {"description": "更新成功，返回最新详情"},
                    "400": {"description": "请求参数错误"},
                    "404": {"description": "放行单不存在"}
                }
            }
        },
        "/releases/{id}/notes": {
            "post": {
                "security": [{"BearerAuth": []}],
                "description": "为指定质检放行单添加操作备注，自动记录操作人和时间，显示在历史时间线中",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["质检放行"],
                "summary": "为质检放行单添加备注",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "放行单ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "备注内容",
                        "name": "request",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "content": {"type": "string"}
                            }
                        }
                    }
                ],
                "responses": {
                    "201": {"description": "添加成功"},
                    "400": {"description": "请求参数错误"},
                    "500": {"description": "添加失败"}
                }
            }
        },
        "/dashboard/stats": {
            "get": {
                "security": [{"BearerAuth": []}],
                "description": "获取各状态的检疫证明和放行单数量统计，用于首页展示",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["仪表盘"],
                "summary": "获取仪表盘统计",
                "responses": {
                    "200": {"description": "统计数据"},
                    "500": {"description": "查询失败"}
                }
            }
        },
        "/dashboard/blocked": {
            "get": {
                "security": [{"BearerAuth": []}],
                "description": "获取所有卡住的检疫证明和待确认的放行单，用于工作台首页展示，及时暴露问题",
                "consumes": ["application/json"],
                "produces": ["application/json"],
                "tags": ["仪表盘"],
                "summary": "获取所有卡住的单子",
                "responses": {
                    "200": {"description": "包含 blocked_certificates 和 on_hold_releases 两个列表"},
                    "500": {"description": "查询失败"}
                }
            }
        }
    },
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Type \"Bearer\" followed by a space and JWT token."
        }
    }
}`

var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "localhost:3000",
	BasePath:         "/api",
	Schemes:          []string{"http"},
	Title:            "肉类分割厂-检疫证明与质检放行系统",
	Description:      "肉类分割厂检疫证明管理、质检放行全流程管理系统，支持角色权限控制、状态流转、历史追溯",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
