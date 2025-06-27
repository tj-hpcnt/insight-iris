import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
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

  @Get('categories/:categoryId/questions')
  async listQuestionsInCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.appService.listQuestionsInCategory(categoryId);
  }

  @Get('insights/:insightId/question-details')
  async getFullQuestionContextByInsightId(@Param('insightId', ParseIntPipe) insightId: number) {
    return this.appService.getFullQuestionContextByInsightId(insightId);
  }

  @Get('questions/:questionId')
  async getQuestionById(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.getQuestionById(questionId);
  }

  @Post('search')
  async searchQuestionsAnswersInsights(@Body() body: { query: string }) {
    return this.appService.searchQuestionsAnswersInsights(body.query);
  }
} 