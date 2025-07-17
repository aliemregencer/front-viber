import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Character } from '../../../../core/services/character.service';

@Component({
  selector: 'app-character-card',
  templateUrl: './character-card.component.html',
  styleUrls: ['./character-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterCardComponent {
  @Input() character!: Character;

  getFullName(): string {
    if (!this.character?.name) return 'Unknown';
    const { first, middle, last } = this.character.name;
    return [first, middle, last].filter(Boolean).join(' ');
  }

  getRandomSaying(): string {
    if (!this.character?.sayings?.length) return '';
    const randomIndex = Math.floor(Math.random() * this.character.sayings.length);
    return this.character.sayings[randomIndex];
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Hide the broken image and let the noImage template show
    img.style.display = 'none';
    // Optionally, you could also set a fallback image
    // img.src = 'assets/images/default-character.png';
  }
}