import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Res, Put, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { generateTimestampedFilename } from './utils/export';
import { AuthGuard, WriteGuard } from './auth/auth.guard';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('categories')
  @UseGuards(AuthGuard)
  async listCategories() {
    return this.appService.listCategories();
  }

  @Post('categories')
  @UseGuards(WriteGuard)
  async createCategory(@Body() body: { category: string; subcategory: string; insightSubject: string }) {
    return this.appService.createCategory(body.category, body.subcategory, body.insightSubject);
  }

  @Delete('categories/:categoryId')
  @UseGuards(WriteGuard)
  async deleteCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.appService.deleteCategory(categoryId);
  }

  @Get('categories/:categoryId/questions')
  @UseGuards(AuthGuard)
  async listQuestionsInCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.appService.listQuestionsInCategory(categoryId);
  }

  @Post('categories/:categoryId/generate')
  @UseGuards(WriteGuard)
  async generateQuestionsForCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Res() res: Response
  ) {
    return this.appService.generateQuestionsForCategory(categoryId, res);
  }

  @Post('propose')
  @UseGuards(WriteGuard)
  async proposeQuestion(
    @Body() body: { proposedQuestionText: string },
    @Res() res: Response
  ) {
    return this.appService.proposeQuestion(body.proposedQuestionText, res);
  }

  @Get('insights/:insightId/question-details')
  @UseGuards(AuthGuard)
  async getFullQuestionContextByInsightId(@Param('insightId', ParseIntPipe) insightId: number) {
    return this.appService.getFullQuestionContextByInsightId(insightId);
  }

  @Get('questions/:questionId')
  @UseGuards(AuthGuard)
  async getQuestionById(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.getQuestionById(questionId);
  }

  @Post('search')
  @UseGuards(AuthGuard)
  async searchQuestionsAnswersInsights(@Body() body: { query: string }) {
    return this.appService.searchQuestionsAnswersInsights(body.query);
  }

  @Get('export')
  @UseGuards(AuthGuard)
  async exportData(@Res() res: Response) {
    const exportData = await this.appService.exportData();
    const filename = generateTimestampedFilename();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportData, null, 2));
  }

  @Post('questions/:questionId/regenerate')
  @UseGuards(WriteGuard)
  async regenerateQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() body: { feedback?: string },
    @Res() res: Response
  ) {
    return this.appService.regenerateQuestion(questionId, body.feedback || '', res);
  }

  @Delete('questions/:questionId')
  @UseGuards(WriteGuard)
  async deleteQuestion(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.deleteQuestion(questionId);
  }

  @Delete('answers/:answerId')
  @UseGuards(WriteGuard)
  async deleteAnswer(@Param('answerId', ParseIntPipe) answerId: number) {
    return this.appService.deleteAnswer(answerId);
  }

  @Get('questions/:questionId/answer-count')
  @UseGuards(AuthGuard)
  async getQuestionAnswerCount(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.getQuestionAnswerCount(questionId);
  }

  @Put('questions/:questionId/approval')
  @UseGuards(WriteGuard)
  async toggleQuestionApproval(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.toggleQuestionApproval(questionId);
  }

  @Get('questions/:questionId/comments')
  @UseGuards(AuthGuard)
  async getQuestionComments(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.appService.getQuestionComments(questionId);
  }

  @Post('questions/:questionId/comments')
  @UseGuards(AuthGuard)
  async addQuestionComment(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() body: { text: string },
    @Req() req: Request
  ) {
    return this.appService.addQuestionComment(questionId, body.text, req.user!.username);
  }

  @Put('comments/:commentId')
  @UseGuards(AuthGuard)
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: { text: string },
    @Req() req: Request
  ) {
    return this.appService.updateComment(commentId, body.text, req.user!.username);
  }

  @Delete('comments/:commentId')
  @UseGuards(AuthGuard)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: Request
  ) {
    return this.appService.deleteComment(commentId, req.user!.username);
  }
} 