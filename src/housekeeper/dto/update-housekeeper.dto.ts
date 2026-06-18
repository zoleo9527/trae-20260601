import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateHousekeeperDto } from './create-housekeeper.dto';

export class UpdateHousekeeperDto extends PartialType(
  OmitType(CreateHousekeeperDto, ['name', 'phone'] as const),
) {}
