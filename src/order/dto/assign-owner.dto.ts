import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Role } from "../../common/enums";

export class AssignOrderOwnerDto {
  @ApiProperty({ description: "责任人角色", enum: Role, example: Role.CUSTOMER_SERVICE })
  @IsEnum(Role)
  @IsNotEmpty()
  ownerRole: Role;

  @ApiProperty({ description: "责任人ID", example: "cs001" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ownerId: string;

  @ApiProperty({ description: "责任人姓名", example: "客服小王" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ownerName: string;
}
