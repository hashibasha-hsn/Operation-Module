import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Process } from './process.entity';
import { ProcessSection } from './process-section.entity';
import { ProcessQuestion } from './process-question.entity';

@Injectable()
export class ProcessesService {
  constructor(
    @InjectRepository(Process)
    private processesRepository: Repository<Process>,
    @InjectRepository(ProcessSection)
    private sectionsRepository: Repository<ProcessSection>,
    @InjectRepository(ProcessQuestion)
    private questionsRepository: Repository<ProcessQuestion>,
  ) {}

  async create(processData: Partial<Process>): Promise<Process> {
    const process = this.processesRepository.create(processData);
    return await this.processesRepository.save(process);
  }

  async findAll(organizationId: string): Promise<Process[]> {
    return await this.processesRepository.find({
      where: { organizationId },
      relations: ['sections', 'sections.questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Process> {
    return await this.processesRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.questions'],
    });
  }

  async update(id: string, processData: Partial<Process>): Promise<Process> {
    await this.processesRepository.update(id, processData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.processesRepository.delete(id);
  }

  async publish(id: string): Promise<Process> {
    return await this.update(id, { status: 'published' });
  }

  async archive(id: string): Promise<Process> {
    return await this.update(id, { status: 'archived' });
  }

  // Section methods
  async createSection(sectionData: Partial<ProcessSection>): Promise<ProcessSection> {
    const section = this.sectionsRepository.create(sectionData);
    return await this.sectionsRepository.save(section);
  }

  async updateSection(id: string, sectionData: Partial<ProcessSection>): Promise<ProcessSection> {
    await this.sectionsRepository.update(id, sectionData);
    return await this.sectionsRepository.findOne({ where: { id } });
  }

  async removeSection(id: string): Promise<void> {
    await this.sectionsRepository.delete(id);
  }

  // Question methods
  async createQuestion(questionData: Partial<ProcessQuestion>): Promise<ProcessQuestion> {
    const question = this.questionsRepository.create(questionData);
    return await this.questionsRepository.save(question);
  }

  async updateQuestion(id: string, questionData: Partial<ProcessQuestion>): Promise<ProcessQuestion> {
    await this.questionsRepository.update(id, questionData);
    return await this.questionsRepository.findOne({ where: { id } });
  }

  async removeQuestion(id: string): Promise<void> {
    await this.questionsRepository.delete(id);
  }
}
