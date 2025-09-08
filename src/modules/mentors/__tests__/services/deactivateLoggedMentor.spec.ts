// import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { DeactivateLoggedMentorService } from '../../services/deactivateLoggedMentor.service';
// import { InMemoryMentorRepository } from '../../repository/inMemory/inMemoryMentor.repository';
// import { MentorRepository } from '../../repository/mentor.repository';
// import { MentorEntity } from '../../entities/mentor.entity';

// let deactivateLoggedMentorService: DeactivateLoggedMentorService;
// let inMemoryMentorRepository: InMemoryMentorRepository;

// describe('DeactivateLoggedMentorService', () => {
//   beforeEach(() => {
//     inMemoryMentorRepository = new InMemoryMentorRepository();
//     deactivateLoggedMentorService = new DeactivateLoggedMentorService(
//       inMemoryMentorRepository as unknown as MentorRepository,
//     );
//     vi.restoreAllMocks();
//   });

<<<<<<< HEAD
  it('should deactivate a mentor successfully', async () => {
    const mentor: MentorEntity = await inMemoryMentorRepository.createNewMentor(
      {
        email: 'mentor@example.com',
        fullName: 'Test Mentor',
        dateOfBirth: new Date('1990-01-01'),
        password: 'hashed-password',
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    const response = await deactivateLoggedMentorService.execute(mentor.id);

    expect(response.message).toBe('Mentor deactivated successfully');

    const deactivatedMentor = await inMemoryMentorRepository.findMentorById(
      mentor.id,
    );

    expect(deactivatedMentor?.deleted).toBe(true);
  });
=======
//   it('should deactivate a mentor successfully', async () => {
//     const mentor: MentorEntity = await inMemoryMentorRepository.createNewMentor({
//       email: 'mentor@example.com',
//       fullName: 'Test Mentor',
//       dateOfBirth: new Date('1990-01-01'),
//       password: 'hashed-password',
//     });
  
//     await new Promise((resolve) => setTimeout(resolve, 10));
  
//     const response = await deactivateLoggedMentorService.execute(mentor.id);
  
//     expect(response.message).toBe('Mentor deactivated successfully');
  
//     const deactivatedMentor = await inMemoryMentorRepository.findMentorById(mentor.id);
  
//     expect(deactivatedMentor?.deleted).toBe(true);
//   });
  
>>>>>>> 092092cf4f70d6a9ee0b7a315dca72df6c80b3ee

//   it('should return a message if the mentor does not exist', async () => {
//     const nonExistentId = '999';

//     const response = await deactivateLoggedMentorService.execute(nonExistentId);

//     expect(response.message).toBe('Mentor not found');
//   });

<<<<<<< HEAD
  it('should return a message if the mentor is already deleted', async () => {
    const mentor: MentorEntity = await inMemoryMentorRepository.createNewMentor(
      {
        email: 'mentor@example.com',
        fullName: 'Test Mentor',
        dateOfBirth: new Date('1990-01-01'),
        password: 'hashed-password',
      },
    );
=======
//   it('should return a message if the mentor is already deleted', async () => {
//     const mentor: MentorEntity = await inMemoryMentorRepository.createNewMentor({
//       email: 'mentor@example.com',
//       fullName: 'Test Mentor',
//       dateOfBirth: new Date('1990-01-01'),
//       password: 'hashed-password',
//     });
>>>>>>> 092092cf4f70d6a9ee0b7a315dca72df6c80b3ee

//     await inMemoryMentorRepository.deactivateMentorById(mentor.id);

//     const response = await deactivateLoggedMentorService.execute(mentor.id);

//     expect(response.message).toBe('This mentor is already deleted');
//   });
// });
