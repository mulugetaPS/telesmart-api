import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  StreamableFile,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { VideoService } from './video.service';
import { CreateVideoDto, QueryVideosDto } from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';

@ApiTags('Videos')
@Controller('videos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get videos with filters' })
  async findAll(@Query() query: QueryVideosDto) {
    return this.videoService.getVideos(query);
  }



  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  async findOne(@Param('id') id: string) {
    return this.videoService.getVideoById(+id);
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream video file' })
  async streamVideo(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const video = await this.videoService.getVideoById(+id);
    const ftpRoot = this.config.get<string>('ftp.root');
    if (!ftpRoot) {
      throw new NotFoundException('FTP root not found');
    }
    const videoPath = join(ftpRoot, video.filepath);

    if (!existsSync(videoPath)) {
      throw new NotFoundException('Video file not found on server');
    }

    const stat = statSync(videoPath);
    const fileStream = createReadStream(videoPath);

    res.set({
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });

    return new StreamableFile(fileStream);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete video' })
  async remove(@Param('id') id: string) {
    return this.videoService.deleteVideo(+id);
  }
}
