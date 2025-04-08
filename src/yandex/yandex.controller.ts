import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
  Get,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

const folderId = '';
const token = '';

// создание ассистента
@Controller('yandex')
export class YandexController {
  @Post('assistant-create')
  async createAssistant(@Body() body: { index: string }) {
    const newBody = {
      folderId: folderId,
      modelUri: `gpt://${folderId}/yandexgpt/latest`,
      tools: [
        {
          searchIndex: {
            searchIndexIds: [body.index],
          },
        },
      ],
    };

    const url =
      'https://rest-assistant.api.cloud.yandex.net/assistants/v1/assistants';

    return this.sendResponse(url, newBody);
  }

  // загрузка файла для RAG
  @Post('file')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || !files.length) {
      return new NotFoundException();
    }
    const file = files[0];

    const base64Content = file.buffer.toString('base64');

    const uploadBody = {
      folderId: folderId,
      mimeType: 'text/markdown',
      content: base64Content,
    };

    const url = 'https://rest-assistant.api.cloud.yandex.net/files/v1/files';

    return this.sendResponse(url, uploadBody);
  }

  // создание индекса
  @Post('index')
  async createIndex(
    @Body()
    body: {
      id: string;
    },
  ) {
    const newBody = {
      folderId: folderId,
      fileIds: [body.id],
      indexType: {
        hybridSearchIndex: {
          chunkingStrategy: {
            static: {
              maxChunkSizeTokens: 1000,
              chunkOverlapTokens: 100,
            },
          },
          combinationStrategy: {
            reciprocalRankFusion: {},
          },
        },
      },
    };

    const url =
      'https://rest-assistant.api.cloud.yandex.net/assistants/v1/searchIndex';

    return this.sendResponse(url, newBody);
  }

  @Post('index-status')
  async getOperationState(
    @Body()
    body: {
      id: string;
    },
  ) {
    const response = await fetch(
      `https://operation.api.cloud.yandex.net/operations/${body.id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Api-Key ${token}`,
        },
      },
    );

    const result = await response.json();

    return result;
  }

  private async sendResponse(url: string, body: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Api-Key ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    return result;
  }
}
