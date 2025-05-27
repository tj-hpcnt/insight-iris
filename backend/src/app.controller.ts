import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('categories')
  async listCategories() {
    return this.appService.listCategories();
  }

  @Get('categories/:categoryId/inspiration-insights')
  async listInspirationInsightsInCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.appService.listInspirationInsightsInCategory(categoryId);
  }

  @Get('categories/:categoryId/answer-insights')
  async listAnswerInsightsInCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.appService.listAnswerInsightsInCategory(categoryId);
  }

  @Get('insights/:insightId/question-details')
  async getFullQuestionContextByInsightId(@Param('insightId', ParseIntPipe) insightId: number) {
    return this.appService.getFullQuestionContextByInsightId(insightId);
  }
} 