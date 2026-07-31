import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CourseCategory } from './course-category.entity';
import { CourseQuiz } from './course-quiz.entity';
import { CourseProgress } from './course-progress.entity';
import { AssessmentResult } from '../assessments/assessment-result.entity';
import { notifyCertificateIssued, notifyLearningAssignment } from '../shared/notification-client';
import { sendCourseCompletionReminderIfNeeded } from '../shared/course-completion-reminders';
import { resolveCourseAssigneeUserIds } from '../shared/course-assignment.util';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course, 'org')
    private coursesRepository: Repository<Course>,
    @InjectRepository(CourseCategory, 'org')
    private courseCategoriesRepository: Repository<CourseCategory>,
    @InjectRepository(CourseQuiz, 'org')
    private courseQuizzesRepository: Repository<CourseQuiz>,
    @InjectRepository(CourseProgress, 'org')
    private courseProgressRepository: Repository<CourseProgress>,
    @InjectRepository(AssessmentResult, 'org')
    private assessmentResultsRepository: Repository<AssessmentResult>,
  ) {}

  // Course methods
  async create(courseData: Partial<Course>): Promise<Course> {
    const course = this.coursesRepository.create(courseData);
    return await this.coursesRepository.save(course);
  }

  async findAll(organizationId: string): Promise<Course[]> {
    return await this.coursesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Course> {
    return await this.coursesRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, courseData: Partial<Course>): Promise<Course> {
    await this.coursesRepository.update(id, courseData);
    return await this.findOne(id);
  }

  async assignCourse(
    id: string,
    assignment: { assigneeIds?: string[]; storeIds?: string[]; assigneeProfiles?: Record<string, unknown> },
  ): Promise<Course> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    const nextAssignees = assignment.assigneeIds ?? existing.assigneeIds ?? [];
    const nextStoreIds = assignment.storeIds ?? existing.storeIds ?? [];
    const nextProfiles = assignment.assigneeProfiles ?? existing.assigneeProfiles ?? null;

    await this.coursesRepository.update(id, {
      assigneeIds: nextAssignees,
      storeIds: nextStoreIds,
      assigneeProfiles: nextProfiles,
    });

    const resolvedUserIds = await resolveCourseAssigneeUserIds({
      assigneeIds: nextAssignees,
      storeIds: nextStoreIds,
      assigneeProfiles: nextProfiles,
    });

    const existingProgress = await this.courseProgressRepository.find({
      where: { courseId: id, organizationId: existing.organizationId },
    });
    const progressUserIds = new Set(existingProgress.map((row) => row.userId));
    const progressCourseIdToUserId = new Map(
      existingProgress.map((row) => [`${row.courseId}:${row.userId}`, row]),
    );

    for (const userId of resolvedUserIds) {
      if (progressUserIds.has(userId)) {
        continue;
      }

      void notifyLearningAssignment({
        userId,
        itemTitle: existing.title,
        itemType: 'course',
        itemId: id,
      });

      await this.createProgress({
        userId,
        courseId: id,
        organizationId: existing.organizationId,
        status: 'not_started',
        progress: 0,
        startedAt: null,
      });
    }

    return this.findOne(id);
  }

  private async markReminderSent(progressId: string, at: Date): Promise<void> {
    await this.courseProgressRepository.update(progressId, { lastReminderAt: at });
  }

  private async maybeSendCompletionReminder(course: Course, progress: CourseProgress): Promise<void> {
    await sendCourseCompletionReminderIfNeeded(course, progress, (progressId, at) =>
      this.markReminderSent(progressId, at),
    );
  }

  async runCourseCompletionReminders(organizationId: string): Promise<{ sent: number; scanned: number }> {
    const rows = await this.courseProgressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.course', 'course')
      .where('progress.organizationId = :organizationId', { organizationId })
      .andWhere('progress.status != :completed', { completed: 'completed' })
      .getMany();

    let sent = 0;
    for (const progress of rows) {
      const course = progress.course ?? (await this.findOne(progress.courseId));
      if (!course) continue;
      const didSend = await sendCourseCompletionReminderIfNeeded(course, progress, (progressId, at) =>
        this.markReminderSent(progressId, at),
      );
      if (didSend) sent += 1;
    }

    return { sent, scanned: rows.length };
  }

  async remove(id: string): Promise<void> {
    await this.coursesRepository.delete(id);
  }

  // Course Category methods
  async createCategory(categoryData: Partial<CourseCategory>): Promise<CourseCategory> {
    const category = this.courseCategoriesRepository.create(categoryData);
    return await this.courseCategoriesRepository.save(category);
  }

  async findAllCategories(organizationId: string): Promise<CourseCategory[]> {
    return await this.courseCategoriesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCategory(id: string, categoryData: Partial<CourseCategory>): Promise<CourseCategory> {
    await this.courseCategoriesRepository.update(id, categoryData);
    return await this.courseCategoriesRepository.findOne({ where: { id } });
  }

  async removeCategory(id: string): Promise<void> {
    await this.courseCategoriesRepository.delete(id);
  }

  // Course Quiz methods
  async createQuiz(quizData: Partial<CourseQuiz>): Promise<CourseQuiz> {
    const quiz = this.courseQuizzesRepository.create(quizData);
    return await this.courseQuizzesRepository.save(quiz);
  }

  async findAllQuizzes(organizationId: string): Promise<CourseQuiz[]> {
    return await this.courseQuizzesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateQuiz(id: string, quizData: Partial<CourseQuiz>): Promise<CourseQuiz> {
    await this.courseQuizzesRepository.update(id, quizData);
    return await this.courseQuizzesRepository.findOne({ where: { id } });
  }

  async removeQuiz(id: string): Promise<void> {
    await this.courseQuizzesRepository.delete(id);
  }

  // Course Progress methods
  async createProgress(progressData: Partial<CourseProgress>): Promise<CourseProgress> {
    const progress = this.courseProgressRepository.create(progressData);
    const saved = await this.courseProgressRepository.save(progress);
    const course = await this.findOne(saved.courseId);
    if (course) {
      void this.maybeSendCompletionReminder(course, saved);
    }
    return saved;
  }

  async findUserProgress(userId: string, organizationId: string): Promise<CourseProgress[]> {
    return await this.courseProgressRepository.find({
      where: { userId, organizationId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateProgress(id: string, progressData: Partial<CourseProgress>): Promise<CourseProgress> {
    const before = await this.courseProgressRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    await this.courseProgressRepository.update(id, progressData);
    const updated = await this.courseProgressRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (
      before &&
      updated &&
      before.status !== 'completed' &&
      updated.status === 'completed'
    ) {
      const course = updated.course ?? (await this.findOne(updated.courseId));
      if (course?.generateCertificate) {
        void notifyCertificateIssued({
          userId: updated.userId,
          itemTitle: course.title,
          itemType: 'course',
          itemId: course.id,
          percentage: updated.progress,
        });
      }
    } else if (updated && updated.status !== 'completed') {
      const course = updated.course ?? (await this.findOne(updated.courseId));
      if (course) {
        void this.maybeSendCompletionReminder(course, updated);
      }
    }

    return updated;
  }

  // Learning Report methods
  async getLearningMyReport(userId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.courseProgressRepository.createQueryBuilder('progress')
      .leftJoinAndSelect('progress.course', 'course')
      .leftJoinAndSelect('course.category', 'category')
      .where('progress.organizationId = :organizationId', { organizationId })
      .andWhere('progress.userId = :userId', { userId });

    if (startDate) {
      query.andWhere('progress.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('progress.createdAt <= :endDate', { endDate });
    }

    const progressData = await query.orderBy('progress.createdAt', 'DESC').getMany();

    // Calculate key highlights
    const totalTimeSpent = progressData.reduce((sum, p) => {
      const timeSpent = p.completedAt && p.startedAt 
        ? (new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60 
        : 0;
      return sum + timeSpent;
    }, 0);

    const totalCourses = progressData.length;
    const completedCourses = progressData.filter(p => p.status === 'completed').length;
    const courseCompletedPercent = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    const coursesWithQuizzes = progressData.filter(p => p.quizScore && p.quizScore.score !== undefined);
    const completedQuizzes = coursesWithQuizzes.length;
    const quizCompletedPercent = totalCourses > 0 ? Math.round((completedQuizzes / totalCourses) * 100) : 0;

    // Leaderboard - get all users in org and rank them
    const allProgress = await this.courseProgressRepository.createQueryBuilder('progress')
      .where('progress.organizationId = :organizationId', { organizationId })
      .getMany();

    const userStats = allProgress.reduce((acc, progress) => {
      if (!acc[progress.userId]) {
        acc[progress.userId] = {
          userId: progress.userId,
          totalProgress: 0,
          completedCount: 0,
          timeSpent: 0,
        };
      }
      acc[progress.userId].totalProgress += progress.progress;
      if (progress.status === 'completed') acc[progress.userId].completedCount++;
      if (progress.completedAt && progress.startedAt) {
        acc[progress.userId].timeSpent += (new Date(progress.completedAt).getTime() - new Date(progress.startedAt).getTime()) / 1000 / 60;
      }
      return acc;
    }, {} as Record<string, any>);

    const leaderboard = Object.values(userStats)
      .map((user: any) => ({
        ...user,
        averageProgress: user.totalProgress / (allProgress.filter(p => p.userId === user.userId).length || 1),
      }))
      .sort((a: any, b: any) => b.completedCount - a.completedCount || b.averageProgress - a.averageProgress)
      .slice(0, 10);

    // Find current user's rank
    const currentUserRank = leaderboard.findIndex((u: any) => u.userId === userId) + 1;

    return {
      keyHighlights: {
        timeSpent: Math.round(totalTimeSpent),
        courseCompletedPercent,
        quizCompletedPercent,
      },
      leaderboard: leaderboard.map((u: any, index: number) => ({
        rank: index + 1,
        userId: u.userId,
        averageProgress: Math.round(u.averageProgress),
        completedCount: u.completedCount,
        timeSpent: Math.round(u.timeSpent),
      })),
      currentUserRank,
      courses: progressData.map(p => ({
        courseId: p.courseId,
        courseTitle: p.course?.title || 'Unknown',
        category: p.course?.category?.categoryName || 'Uncategorized',
        progress: p.progress,
        status: p.status,
        timeSpent: p.completedAt && p.startedAt 
          ? Math.round((new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60)
          : 0,
        quizScore: p.quizScore?.score || null,
        quizStatus: p.quizScore ? 'completed' : 'pending',
      })),
    };
  }

  async getLearningStoreReport(storeId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.courseProgressRepository.createQueryBuilder('progress')
      .leftJoinAndSelect('progress.course', 'course')
      .leftJoinAndSelect('course.category', 'category')
      .where('progress.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('progress.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('progress.createdAt <= :endDate', { endDate });
    }

    const allProgress = await query.orderBy('progress.createdAt', 'DESC').getMany();
    
    // Filter by storeId from course assignee profiles
    const storeProgress = allProgress.filter(progress => {
      const assigneeProfiles = progress.course?.assigneeProfiles;
      if (!assigneeProfiles) return false;
      
      const storeAssignments = assigneeProfiles.stores || [];
      return storeAssignments.includes(storeId);
    });

    // Calculate store-level stats
    const uniqueUsers = [...new Set(storeProgress.map(p => p.userId))];
    const totalTimeSpent = storeProgress.reduce((sum, p) => {
      if (p.completedAt && p.startedAt) {
        return sum + (new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60;
      }
      return sum;
    }, 0);

    const totalProgress = storeProgress.reduce((sum, p) => sum + p.progress, 0);
    const averageProgress = storeProgress.length > 0 ? Math.round(totalProgress / storeProgress.length) : 0;

    // Employee-level data
    const employeeData = uniqueUsers.map(userId => {
      const userProgressData = storeProgress.filter(p => p.userId === userId);
      const completedCourses = userProgressData.filter(p => p.status === 'completed').length;
      const userTimeSpent = userProgressData.reduce((sum, p) => {
        if (p.completedAt && p.startedAt) {
          return sum + (new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60;
        }
        return sum;
      }, 0);
      const totalUserProgress = userProgressData.reduce((sum, p) => sum + p.progress, 0);
      const avgProgress = userProgressData.length > 0 ? Math.round(totalUserProgress / userProgressData.length) : 0;

      return {
        userId,
        email: userProgressData[0]?.userId || 'N/A',
        designation: 'N/A',
        supervisor: 'N/A',
        storeName: storeId,
        progress: avgProgress,
        completedCourses: `${completedCourses}/${userProgressData.length}`,
        timeSpent: Math.round(userTimeSpent),
      };
    });

    return {
      storeId,
      employeeCount: uniqueUsers.length,
      progress: averageProgress,
      timeSpent: Math.round(totalTimeSpent),
      employees: employeeData,
    };
  }

  async getLearningTeamReport(supervisorId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.courseProgressRepository.createQueryBuilder('progress')
      .leftJoinAndSelect('progress.course', 'course')
      .where('progress.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('progress.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('progress.createdAt <= :endDate', { endDate });
    }

    const allProgress = await query.orderBy('progress.createdAt', 'DESC').getMany();
    
    // Filter by supervisor hierarchy (this would need to be implemented based on user hierarchy)
    // For now, return all progress for the organization
    const teamProgress = allProgress;

    // Calculate team-level stats
    const uniqueUsers = [...new Set(teamProgress.map(p => p.userId))];
    const totalTimeSpent = teamProgress.reduce((sum, p) => {
      if (p.completedAt && p.startedAt) {
        return sum + (new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60;
      }
      return sum;
    }, 0);

    const totalProgress = teamProgress.reduce((sum, p) => sum + p.progress, 0);
    const averageProgress = teamProgress.length > 0 ? Math.round(totalProgress / teamProgress.length) : 0;

    // Quiz scores
    const quizScores = teamProgress
      .filter(p => p.quizScore && p.quizScore.score !== undefined)
      .map(p => p.quizScore.score);
    const averageQuizScore = quizScores.length > 0 
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) 
      : 0;

    // Employee grid
    const employeeData = uniqueUsers.map(userId => {
      const userProgressData = teamProgress.filter(p => p.userId === userId);
      const completedCourses = userProgressData.filter(p => p.status === 'completed').length;
      const userTimeSpent = userProgressData.reduce((sum, p) => {
        if (p.completedAt && p.startedAt) {
          return sum + (new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60;
        }
        return sum;
      }, 0);
      const totalUserProgress = userProgressData.reduce((sum, p) => sum + p.progress, 0);
      const avgProgress = userProgressData.length > 0 ? Math.round(totalUserProgress / userProgressData.length) : 0;

      return {
        userId,
        supervisor: 'N/A',
        role: 'N/A',
        storeName: 'N/A',
        progress: avgProgress,
        completedCourses: `${completedCourses}/${userProgressData.length}`,
        timeSpent: Math.round(userTimeSpent),
      };
    });

    // Leaderboard
    const leaderboard = employeeData
      .sort((a, b) => b.progress - a.progress || parseFloat(b.completedCourses) - parseFloat(a.completedCourses))
      .slice(0, 10);

    return {
      teamProgressSummary: {
        timeSpent: Math.round(totalTimeSpent),
        coursesCompleted: Math.round((teamProgress.filter(p => p.status === 'completed').length / teamProgress.length) * 100),
        quizScore: averageQuizScore,
      },
      leaderboard,
      employees: employeeData,
    };
  }

  async getLearningOrgReport(organizationId: string, filters: any = {}): Promise<any> {
    const tab = filters.tab || 'courses';
    const now = new Date();

    const progressQuery = this.courseProgressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.course', 'course')
      .leftJoinAndSelect('course.category', 'category')
      .where('progress.organizationId = :organizationId', { organizationId });

    if (filters.startDate) {
      progressQuery.andWhere('progress.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      progressQuery.andWhere('progress.createdAt <= :endDate', { endDate: end });
    }
    if (filters.userId && filters.userId !== 'all') {
      progressQuery.andWhere('progress.userId = :userId', { userId: filters.userId });
    }
    if (filters.status && !['all', 'compliant', 'nonCompliant', 'overdue'].includes(filters.status)) {
      progressQuery.andWhere('progress.status = :status', { status: filters.status });
    }
    if (filters.search) {
      progressQuery.andWhere(
        '(course.title ILIKE :search OR progress.userId ILIKE :search OR progress.id::text ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const progressData = await progressQuery.orderBy('progress.createdAt', 'DESC').getMany();

    const courses = await this.coursesRepository.find({
      where: { organizationId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });

    const assessmentQuery = this.assessmentResultsRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.assessment', 'assessment')
      .where('result.organizationId = :organizationId', { organizationId });
    if (filters.startDate) {
      assessmentQuery.andWhere('result.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      assessmentQuery.andWhere('result.createdAt <= :endDate', { endDate: end });
    }
    const assessmentResults = await assessmentQuery.orderBy('result.createdAt', 'DESC').getMany();

    const minutesSpent = (p: CourseProgress) => {
      if (p.completedAt && p.startedAt) {
        return Math.max(
          0,
          Math.round(
            (new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60,
          ),
        );
      }
      return 0;
    };

    // Course completion tracking
    const courseRows = courses.map((course) => {
      const courseProgress = progressData.filter((p) => p.courseId === course.id);
      const assigned = Math.max(courseProgress.length, (course.assigneeIds || []).length);
      const completed = courseProgress.filter((p) => p.status === 'completed').length;
      const inProgress = courseProgress.filter((p) => p.status === 'in_progress').length;
      const notStarted = courseProgress.filter((p) => p.status === 'not_started').length;
      const avgProgress =
        courseProgress.length > 0
          ? Math.round(
              courseProgress.reduce((s, p) => s + (p.progress || 0), 0) / courseProgress.length,
            )
          : 0;
      const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      const expired = Boolean(course.expiresAt) && new Date(course.expiresAt) < now;
      const overdue = courseProgress.filter(
        (p) =>
          p.status !== 'completed' &&
          course.expiresAt &&
          new Date(course.expiresAt) < now,
      ).length;
      return {
        courseId: course.id,
        courseTitle: course.title,
        files: Array.isArray(course.content) ? course.content.length : 0,
        category: course.category?.categoryName || 'Uncategorized',
        launchDate: course.publishedAt,
        expiresAt: course.expiresAt,
        status: course.isActive ? 'Active' : 'Inactive',
        courseStatus: course.status,
        assigned,
        completed,
        inProgress,
        notStarted,
        avgProgress,
        completionRate,
        isExpired: expired,
        overdue,
      };
    });

    // Learner progress metrics
    const uniqueUsers = [...new Set(progressData.map((p) => p.userId))];
    const learnerRows = uniqueUsers.map((userId) => {
      const userProgress = progressData.filter((p) => p.userId === userId);
      const completed = userProgress.filter((p) => p.status === 'completed').length;
      const inProgress = userProgress.filter((p) => p.status === 'in_progress').length;
      const notStarted = userProgress.filter((p) => p.status === 'not_started').length;
      const avgProgress =
        userProgress.length > 0
          ? Math.round(userProgress.reduce((s, p) => s + (p.progress || 0), 0) / userProgress.length)
          : 0;
      const timeSpent = userProgress.reduce((s, p) => s + minutesSpent(p), 0);
      const overdue = userProgress.filter((p) => {
        const course = courses.find((c) => c.id === p.courseId);
        return (
          p.status !== 'completed' && course?.expiresAt && new Date(course.expiresAt) < now
        );
      }).length;
      const quizScores = userProgress
        .map((p) => p.quizScore?.score)
        .filter((s): s is number => typeof s === 'number');
      const avgQuizScore =
        quizScores.length > 0
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : null;
      const complianceRate =
        userProgress.length > 0 ? Math.round((completed / userProgress.length) * 100) : 0;
      return {
        userId,
        email: userId,
        designation: 'N/A',
        supervisor: 'N/A',
        storeName: 'N/A',
        progress: avgProgress,
        completedCourses: `${completed}/${userProgress.length}`,
        completed,
        assigned: userProgress.length,
        inProgress,
        notStarted,
        overdue,
        timeSpent,
        avgQuizScore,
        complianceRate,
        isCompliant: overdue === 0 && (userProgress.length === 0 || completed === userProgress.length),
      };
    });

    // Assessment / quiz performance
    const quizSubmissions = progressData
      .filter((p) => p.quizScore && p.quizScore.score !== undefined)
      .map((p) => ({
        quizSubmissionId: p.id,
        type: 'course_quiz',
        name: p.course?.title || 'Course Quiz',
        date: p.createdAt,
        startedAt: p.startedAt,
        endedAt: p.completedAt,
        attempt: 1,
        storeId: 'N/A',
        submittedBy: p.userId,
        submitterEmail: p.userId,
        employeeId: p.userId,
        timeTaken: minutesSpent(p),
        totalScore: p.quizScore.score,
        status: p.quizScore.score >= 70 ? 'Passed' : 'Failed',
      }));

    const assessmentRows = assessmentResults.map((r) => ({
      id: r.id,
      type: 'assessment',
      name: r.assessment?.title || 'Assessment',
      user: r.userEmail || r.userId,
      score: r.percentage ?? r.score,
      status: r.passed ? 'Passed' : 'Failed',
      date: r.completedAt || r.createdAt,
      storeId: r.storeId || 'N/A',
      attempt: r.attemptNumber,
      timeTaken: r.timeTaken != null ? Math.round(r.timeTaken / 60) : 0,
    }));

    const assessmentPerf = [
      ...quizSubmissions.map((q) => ({
        id: q.quizSubmissionId,
        name: q.name,
        user: q.submittedBy,
        score: q.totalScore,
        status: q.status,
        date: q.date,
        type: q.type,
        attempt: q.attempt,
        timeTaken: q.timeTaken,
      })),
      ...assessmentRows,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Training compliance
    const complianceRows = progressData.map((p) => {
      const course = courses.find((c) => c.id === p.courseId) || p.course;
      const expired = Boolean(course?.expiresAt) && new Date(course.expiresAt) < now;
      const overdue = p.status !== 'completed' && expired;
      const dueSoon =
        p.status !== 'completed' &&
        course?.expiresAt &&
        !expired &&
        new Date(course.expiresAt).getTime() - now.getTime() <= 14 * 24 * 60 * 60 * 1000;
      return {
        progressId: p.id,
        userId: p.userId,
        courseId: p.courseId,
        courseTitle: course?.title || p.course?.title || 'Course',
        status: p.status,
        progress: p.progress || 0,
        expiresAt: course?.expiresAt || null,
        isExpired: expired,
        isOverdue: overdue,
        isDueSoon: Boolean(dueSoon),
        isCompliant: p.status === 'completed' || !course?.expiresAt,
        completedAt: p.completedAt,
        startedAt: p.startedAt,
      };
    });

    // Apply computed status filters
    let filteredCourses = courseRows;
    let filteredLearners = learnerRows;
    let filteredCompliance = complianceRows;
    if (filters.status === 'overdue') {
      filteredCompliance = complianceRows.filter((r) => r.isOverdue);
      filteredLearners = learnerRows.filter((r) => r.overdue > 0);
      filteredCourses = courseRows.filter((r) => r.overdue > 0);
    } else if (filters.status === 'compliant') {
      filteredCompliance = complianceRows.filter((r) => r.isCompliant);
      filteredLearners = learnerRows.filter((r) => r.isCompliant);
    } else if (filters.status === 'nonCompliant') {
      filteredCompliance = complianceRows.filter((r) => !r.isCompliant);
      filteredLearners = learnerRows.filter((r) => !r.isCompliant);
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      filteredCourses = filteredCourses.filter((c) => {
        const course = courses.find((x) => x.id === c.courseId);
        return course?.categoryId === filters.categoryId;
      });
    }

    const totalAssignments = progressData.length;
    const completedAssignments = progressData.filter((p) => p.status === 'completed').length;
    const inProgressAssignments = progressData.filter((p) => p.status === 'in_progress').length;
    const notStartedAssignments = progressData.filter((p) => p.status === 'not_started').length;
    const overdueAssignments = complianceRows.filter((r) => r.isOverdue).length;
    const completionRate =
      totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
    const avgLearnerProgress =
      learnerRows.length > 0
        ? Math.round(learnerRows.reduce((s, l) => s + l.progress, 0) / learnerRows.length)
        : 0;
    const totalTimeSpent = learnerRows.reduce((s, l) => s + l.timeSpent, 0);
    const assessmentPass = assessmentPerf.filter((a) => a.status === 'Passed').length;
    const assessmentFail = assessmentPerf.filter((a) => a.status === 'Failed').length;
    const assessmentPassRate =
      assessmentPerf.length > 0
        ? Math.round((assessmentPass / assessmentPerf.length) * 100)
        : 0;
    const avgAssessmentScore =
      assessmentPerf.length > 0
        ? Math.round(
            assessmentPerf.reduce((s, a) => s + (Number(a.score) || 0), 0) / assessmentPerf.length,
          )
        : 0;
    const complianceRate =
      complianceRows.length > 0
        ? Math.round(
            (complianceRows.filter((r) => r.isCompliant).length / complianceRows.length) * 100,
          )
        : 100;

    const byCategoryMap: Record<string, any> = {};
    courseRows.forEach((c) => {
      const key = c.category || 'Uncategorized';
      if (!byCategoryMap[key]) {
        byCategoryMap[key] = { category: key, courses: 0, assigned: 0, completed: 0 };
      }
      byCategoryMap[key].courses++;
      byCategoryMap[key].assigned += c.assigned;
      byCategoryMap[key].completed += c.completed;
    });
    const byCategory = Object.values(byCategoryMap).map((row: any) => ({
      ...row,
      completionRate:
        row.assigned > 0 ? Math.round((row.completed / row.assigned) * 100) : 0,
    }));

    const trendMap: Record<
      string,
      { date: string; started: number; completed: number; assessments: number }
    > = {};
    progressData.forEach((p) => {
      if (p.startedAt) {
        const key = new Date(p.startedAt).toISOString().slice(0, 10);
        if (!trendMap[key]) trendMap[key] = { date: key, started: 0, completed: 0, assessments: 0 };
        trendMap[key].started++;
      }
      if (p.completedAt) {
        const key = new Date(p.completedAt).toISOString().slice(0, 10);
        if (!trendMap[key]) trendMap[key] = { date: key, started: 0, completed: 0, assessments: 0 };
        trendMap[key].completed++;
      }
    });
    assessmentResults.forEach((r) => {
      const d = r.completedAt || r.createdAt;
      if (!d) return;
      const key = new Date(d).toISOString().slice(0, 10);
      if (!trendMap[key]) trendMap[key] = { date: key, started: 0, completed: 0, assessments: 0 };
      trendMap[key].assessments++;
    });
    const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    const kpis = {
      totalCourses: courses.length,
      totalLearners: learnerRows.length,
      totalAssignments,
      completed: completedAssignments,
      inProgress: inProgressAssignments,
      notStarted: notStartedAssignments,
      overdue: overdueAssignments,
      completionRate,
      avgProgress: avgLearnerProgress,
      totalTimeSpent,
      assessmentPassRate,
      avgAssessmentScore,
      complianceRate,
      assessmentCount: assessmentPerf.length,
    };

    const statusCounts = {
      total: totalAssignments,
      completed: completedAssignments,
      inProgress: inProgressAssignments,
      notStarted: notStartedAssignments,
      overdue: overdueAssignments,
      compliant: complianceRows.filter((r) => r.isCompliant).length,
      nonCompliant: complianceRows.filter((r) => !r.isCompliant).length,
    };

    // Backward-compatible tab payloads
    const legacy =
      tab === 'employees'
        ? { employees: filteredLearners }
        : tab === 'quiz'
          ? { quizSubmissions }
          : { courses: filteredCourses };

    return {
      ...legacy,
      courses: filteredCourses,
      employees: filteredLearners,
      learners: filteredLearners,
      quizSubmissions,
      assessments: assessmentPerf,
      compliance: filteredCompliance,
      byCategory,
      trends,
      kpis,
      statusCounts,
      categories: (
        await this.courseCategoriesRepository.find({ where: { organizationId } })
      ).map((c) => ({ id: c.id, name: c.categoryName })),
    };
  }
}
