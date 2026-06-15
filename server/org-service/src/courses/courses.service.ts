import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CourseCategory } from './course-category.entity';
import { CourseQuiz } from './course-quiz.entity';
import { CourseProgress } from './course-progress.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(CourseCategory)
    private courseCategoriesRepository: Repository<CourseCategory>,
    @InjectRepository(CourseQuiz)
    private courseQuizzesRepository: Repository<CourseQuiz>,
    @InjectRepository(CourseProgress)
    private courseProgressRepository: Repository<CourseProgress>,
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
    return await this.courseProgressRepository.save(progress);
  }

  async findUserProgress(userId: string, organizationId: string): Promise<CourseProgress[]> {
    return await this.courseProgressRepository.find({
      where: { userId, organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateProgress(id: string, progressData: Partial<CourseProgress>): Promise<CourseProgress> {
    await this.courseProgressRepository.update(id, progressData);
    return await this.courseProgressRepository.findOne({ where: { id } });
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

  async getLearningOrgReport(organizationId: string, tab: string = 'courses', startDate?: Date, endDate?: Date): Promise<any> {
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

    const progressData = await query.orderBy('progress.createdAt', 'DESC').getMany();

    if (tab === 'courses') {
      // Get all courses
      const coursesQuery = this.coursesRepository.createQueryBuilder('course')
        .leftJoinAndSelect('course.category', 'category')
        .where('course.organizationId = :organizationId', { organizationId });
      
      const courses = await coursesQuery.orderBy('course.createdAt', 'DESC').getMany();

      const courseData = courses.map(course => {
        const courseProgress = progressData.filter(p => p.courseId === course.id);
        const files = course.content?.length || 0;
        return {
          courseId: course.id,
          courseTitle: course.title,
          files,
          category: course.category?.categoryName || 'Uncategorized',
          launchDate: course.publishedAt,
          status: course.isActive ? 'Active' : 'Inactive',
        };
      });

      return { courses: courseData };
    } else if (tab === 'employees') {
      // Group by user
      const uniqueUsers = [...new Set(progressData.map(p => p.userId))];
      const employeeData = uniqueUsers.map(userId => {
        const userProgressData = progressData.filter(p => p.userId === userId);
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
          storeName: 'N/A',
          progress: avgProgress,
          completedCourses: `${completedCourses}/${userProgressData.length}`,
          timeSpent: Math.round(userTimeSpent),
        };
      });

      return { employees: employeeData };
    } else if (tab === 'quiz') {
      // Quiz submissions
      const quizSubmissions = progressData
        .filter(p => p.quizScore && p.quizScore.score !== undefined)
        .map(p => ({
          quizSubmissionId: p.id,
          date: p.createdAt,
          startedAt: p.startedAt,
          endedAt: p.completedAt,
          attempt: 1,
          storeId: 'N/A',
          submittedBy: p.userId,
          submitterEmail: p.userId,
          employeeId: p.userId,
          timeTaken: p.completedAt && p.startedAt 
            ? Math.round((new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime()) / 1000 / 60)
            : 0,
          totalScore: p.quizScore.score,
        }));

      return { quizSubmissions };
    }

    return {};
  }
}
