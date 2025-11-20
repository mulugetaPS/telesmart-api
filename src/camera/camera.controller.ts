import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CameraService } from './camera.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { LiveStreamResponseDto } from '../imou/dto/imou.dto';

@ApiTags('Camera')
@Controller('camera')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CameraController {
  constructor(private readonly cameraService: CameraService) { }


}
