import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { generateTimestampedFilename } from './utils/export';

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

  @Post('categories')
  async createCategory(@Body() body: { category: string; subcategory: string; insightSubject: string }) {
    return this.appService.createCategory(body.category, body.subcategory, body.insightSubject);
  }

  @Get('categories/:categoryId/questions')
  async listQuestionsInCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.appService.listQuestionsInCategory(categoryId);
  }

  @Post('categories/:categoryId/generate')
  async generateQuestionsForCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Res() res: Response
  ) {
    return this.appService.generateQuestionsForCategory(categoryId, res);
  }

  @Post('propose')
  async proposeQuestion(
    @Body() body: { proposedQuestionText: string },
    @Res() res: Response
  ) {
    return this.appService.proposeQuestion(body.proposedQuestionText, res);
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

  @Get('export')
  async exportData(@Res() res: Response) {
    const exportData = await this.appService.exportData();
    const filename = generateTimestampedFilename();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportData, null, 2));
  }

  @Delete('questions/:questionId')
  async deleteQuestion(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.deleteQuestion(questionId);
  }

  @Delete('answers/:answerId')
  async deleteAnswer(@Param('answerId', ParseIntPipe) answerId: number) {
    return this.appService.deleteAnswer(answerId);
  }

  @Get('questions/:questionId/answer-count')
  async getQuestionAnswerCount(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.getQuestionAnswerCount(questionId);
  }
} 