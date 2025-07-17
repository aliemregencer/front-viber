import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterService, NewCharacterData } from '../../../core/services/character.service';

interface CharacterFormData {
  step1: {
    firstName: string;
    lastName: string;
    species: string;
    occupation: string;
    gender: string;
    homePlanet: string;
  };
  step2: {
    age: number | null;
    eyeColor: string;
    hairColor: string;
    modelNumber?: string;
  };
  step3: {
    skills: string[];
    description: string;
  };
}

@Component({
  selector: 'app-create-character',
  templateUrl: './create-character.component.html',
  styleUrls: ['./create-character.component.css']
})
export class CreateCharacterComponent implements OnInit, OnDestroy {
  currentStep = 1;
  totalSteps = 3;

  step1Form!: FormGroup;
  step2Form!: FormGroup;
  step3Form!: FormGroup;

  private storageKey = 'create-character-form-data';

  // Options for dropdowns
  speciesOptions = ['Human', 'Robot', 'Alien', 'Mutant', 'Other'];
  occupationOptions = ['Captain', 'Pilot', 'Engineer', 'Doctor', 'Scientist', 'Delivery Boy', 'Professor', 'Diğer...'];
  genderOptions = ['Male', 'Female', 'Robot', 'Unknown', 'Diğer...'];
  planetOptions = ['Earth', 'Mars', 'Omicron Persei 8', 'Decapod 10', 'Amphibios 9', 'Robot Hell', 'Moon', 'Diğer...'];
  eyeColorOptions = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Red', 'Purple', 'Other'];
  hairColorOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Blue', 'Green', 'Purple', 'Bald', 'Other'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private characterService: CharacterService
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.loadFromStorage();
  }

  ngOnDestroy() {
    this.saveToStorage();
  }

  initializeForms() {
    // Step 1: Basic Information
    this.step1Form = this.fb.group({
      firstName: ['', [Validators.required, this.noWhitespaceValidator]],
      lastName: ['', [Validators.required, this.noWhitespaceValidator]],
      species: ['', Validators.required],
      occupation: ['', Validators.required],
      customOccupation: [''],
      gender: ['', Validators.required],
      customGender: [''],
      homePlanet: ['', Validators.required],
      customHomePlanet: ['']
    });

    // Step 2: Physical Characteristics
    this.step2Form = this.fb.group({
      age: [null, [this.ageValidator]],
      eyeColor: ['', Validators.required],
      hairColor: ['', Validators.required],
      modelNumber: ['']
    });

    // Step 3: Additional Information
    this.step3Form = this.fb.group({
      skills: this.fb.array([]),
      description: ['', [Validators.maxLength(500)]]
    });

    // Watch for species changes to show/hide model number and make age required
    this.step1Form.get('species')?.valueChanges.subscribe(species => {
      this.updateFormValidation(species);
    });

    // Watch for occupation changes to show/hide custom occupation field
    this.step1Form.get('occupation')?.valueChanges.subscribe(occupation => {
      this.updateOccupationValidation(occupation);
    });

    // Watch for gender changes to show/hide custom gender field
    this.step1Form.get('gender')?.valueChanges.subscribe(gender => {
      this.updateGenderValidation(gender);
    });

    // Watch for planet changes to show/hide custom planet field
    this.step1Form.get('homePlanet')?.valueChanges.subscribe(planet => {
      this.updatePlanetValidation(planet);
    });
  }

  // Custom Validators
  noWhitespaceValidator(control: AbstractControl) {
    if (!control.value || control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  ageValidator(control: AbstractControl) {
    const value = control.value;
    if (value !== null && value !== undefined && value !== '') {
      if (value < 0 || value > 999) {
        return { ageRange: true };
      }
    }
    return null;
  }

  skillValidator(control: AbstractControl) {
    if (!control.value || control.value.trim().length === 0) {
      return { emptySkill: true };
    }
    return null;
  }

  updateFormValidation(species: string) {
    const ageControl = this.step2Form.get('age');
    const modelNumberControl = this.step2Form.get('modelNumber');

    if (species?.toLowerCase() === 'human') {
      ageControl?.setValidators([Validators.required, this.ageValidator]);
      modelNumberControl?.clearValidators();
    } else if (species?.toLowerCase() === 'robot') {
      ageControl?.setValidators([this.ageValidator]);
      modelNumberControl?.setValidators([Validators.required]);
    } else {
      ageControl?.setValidators([this.ageValidator]);
      modelNumberControl?.clearValidators();
    }

    ageControl?.updateValueAndValidity();
    modelNumberControl?.updateValueAndValidity();
  }

  updateOccupationValidation(occupation: string) {
    const customOccupationControl = this.step1Form.get('customOccupation');

    if (occupation === 'Diğer...') {
      customOccupationControl?.setValidators([Validators.required, this.noWhitespaceValidator]);
    } else {
      customOccupationControl?.clearValidators();
      customOccupationControl?.setValue('');
    }

    customOccupationControl?.updateValueAndValidity();
  }

  updateGenderValidation(gender: string) {
    const customGenderControl = this.step1Form.get('customGender');

    if (gender === 'Diğer...') {
      customGenderControl?.setValidators([Validators.required, this.noWhitespaceValidator]);
    } else {
      customGenderControl?.clearValidators();
      customGenderControl?.setValue('');
    }

    customGenderControl?.updateValueAndValidity();
  }

  updatePlanetValidation(planet: string) {
    const customPlanetControl = this.step1Form.get('customHomePlanet');

    if (planet === 'Diğer...') {
      customPlanetControl?.setValidators([Validators.required, this.noWhitespaceValidator]);
    } else {
      customPlanetControl?.clearValidators();
      customPlanetControl?.setValue('');
    }

    customPlanetControl?.updateValueAndValidity();
  }

  // Skills FormArray management
  get skillsArray(): FormArray {
    return this.step3Form.get('skills') as FormArray;
  }

  addSkill() {
    const skillControl = this.fb.control('', [Validators.required, this.skillValidator]);
    this.skillsArray.push(skillControl);
  }

  removeSkill(index: number) {
    this.skillsArray.removeAt(index);
  }

  // Navigation
  nextStep() {
    if (this.isCurrentStepValid()) {
      this.saveToStorage();
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    } else {
      this.markCurrentStepAsTouched();
    }
  }

  previousStep() {
    this.saveToStorage();
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep || this.isStepValid(step - 1)) {
      this.saveToStorage();
      this.currentStep = step;
    }
  }

  isCurrentStepValid(): boolean {
    return this.isStepValid(this.currentStep);
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return this.step1Form.valid;
      case 2: return this.step2Form.valid;
      case 3: return this.step3Form.valid;
      default: return false;
    }
  }

  markCurrentStepAsTouched() {
    switch (this.currentStep) {
      case 1:
        this.step1Form.markAllAsTouched();
        break;
      case 2:
        this.step2Form.markAllAsTouched();
        break;
      case 3:
        this.step3Form.markAllAsTouched();
        break;
    }
  }

  // Progress calculation
  getProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  // Storage management
  saveToStorage() {
    const formData: CharacterFormData = {
      step1: this.step1Form.value,
      step2: this.step2Form.value,
      step3: {
        skills: this.skillsArray.value,
        description: this.step3Form.get('description')?.value || ''
      }
    };

    localStorage.setItem(this.storageKey, JSON.stringify({
      currentStep: this.currentStep,
      formData
    }));
  }

  loadFromStorage() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const { currentStep, formData } = JSON.parse(stored);

        this.currentStep = currentStep || 1;

        if (formData) {
          // Load step 1
          if (formData.step1) {
            this.step1Form.patchValue(formData.step1);
            // Trigger species validation
            if (formData.step1.species) {
              this.updateFormValidation(formData.step1.species);
            }
          }

          // Load step 2
          if (formData.step2) {
            this.step2Form.patchValue(formData.step2);
          }

          // Load step 3
          if (formData.step3) {
            this.step3Form.get('description')?.setValue(formData.step3.description || '');

            // Load skills
            if (formData.step3.skills && formData.step3.skills.length > 0) {
              formData.step3.skills.forEach((skill: string) => {
                const skillControl = this.fb.control(skill, [Validators.required, this.skillValidator]);
                this.skillsArray.push(skillControl);
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading form data from storage:', error);
      }
    }
  }

  clearStorage() {
    localStorage.removeItem(this.storageKey);
  }

  // Form submission
  onSubmit() {
    if (this.step1Form.valid && this.step2Form.valid && this.step3Form.valid) {
      // Get final values for occupation, gender, and planet
      const occupation = this.step1Form.get('occupation')?.value === 'Diğer...'
        ? this.step1Form.get('customOccupation')?.value
        : this.step1Form.get('occupation')?.value;

      const gender = this.step1Form.get('gender')?.value === 'Diğer...'
        ? this.step1Form.get('customGender')?.value
        : this.step1Form.get('gender')?.value;

      const homePlanet = this.step1Form.get('homePlanet')?.value === 'Diğer...'
        ? this.step1Form.get('customHomePlanet')?.value
        : this.step1Form.get('homePlanet')?.value;

      const characterData: NewCharacterData = {
        firstName: this.step1Form.get('firstName')?.value,
        lastName: this.step1Form.get('lastName')?.value,
        species: this.step1Form.get('species')?.value,
        occupation: occupation,
        gender: gender,
        homePlanet: homePlanet,
        age: this.step2Form.get('age')?.value,
        eyeColor: this.step2Form.get('eyeColor')?.value,
        hairColor: this.step2Form.get('hairColor')?.value,
        modelNumber: this.step2Form.get('modelNumber')?.value,
        skills: this.skillsArray.value.filter((skill: string) => skill && skill.trim()),
        description: this.step3Form.get('description')?.value || ''
      };

      console.log('Character Data Submitted:', characterData);

      // Add character to service
      const newCharacter = this.characterService.addCharacter(characterData);
      console.log('New Character Added:', newCharacter);

      // Clear storage and reset forms
      this.clearStorage();
      this.resetAllForms();

      // Show success message and redirect
      alert('Karakter başarıyla oluşturuldu!');
      this.router.navigate(['/characters']);
    } else {
      this.markCurrentStepAsTouched();
    }
  }

  resetAllForms() {
    // Reset all forms
    this.step1Form.reset();
    this.step2Form.reset();
    this.step3Form.reset();

    // Clear skills array
    while (this.skillsArray.length !== 0) {
      this.skillsArray.removeAt(0);
    }

    // Reset current step
    this.currentStep = 1;

    // Mark all forms as pristine and untouched
    this.step1Form.markAsPristine();
    this.step1Form.markAsUntouched();
    this.step2Form.markAsPristine();
    this.step2Form.markAsUntouched();
    this.step3Form.markAsPristine();
    this.step3Form.markAsUntouched();
  }

  // Helper methods for template
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} zorunludur`;
      if (field.errors['whitespace']) return `${fieldName} boş bırakılamaz`;
      if (field.errors['ageRange']) return 'Yaş 0-999 arasında olmalıdır';
      if (field.errors['maxlength']) return `Maksimum ${field.errors['maxlength'].requiredLength} karakter`;
      if (field.errors['emptySkill']) return 'Yetenek boş olamaz';
    }
    return '';
  }

  isSkillInvalid(index: number): boolean {
    const skill = this.skillsArray.at(index);
    return !!(skill && skill.invalid && (skill.dirty || skill.touched));
  }

  getSkillError(index: number): string {
    const skill = this.skillsArray.at(index);
    if (skill && skill.errors && (skill.dirty || skill.touched)) {
      if (skill.errors['required'] || skill.errors['emptySkill']) return 'Yetenek boş olamaz';
    }
    return '';
  }

  shouldShowModelNumber(): boolean {
    return this.step1Form.get('species')?.value?.toLowerCase() === 'robot';
  }

  isAgeRequired(): boolean {
    return this.step1Form.get('species')?.value?.toLowerCase() === 'human';
  }

  shouldShowCustomOccupation(): boolean {
    return this.step1Form.get('occupation')?.value === 'Diğer...';
  }

  shouldShowCustomGender(): boolean {
    return this.step1Form.get('gender')?.value === 'Diğer...';
  }

  shouldShowCustomPlanet(): boolean {
    return this.step1Form.get('homePlanet')?.value === 'Diğer...';
  }
}
