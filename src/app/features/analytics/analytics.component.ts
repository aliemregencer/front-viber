import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CharacterService, Character } from '../../core/services/character.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  characters: Character[] = [];
  loading = true;
  error: string | null = null;

  selectedChartType: 'pie' | 'bar' | 'line' = 'pie';
  selectedDataType: 'gender' | 'species' | 'occupation' = 'gender';

  chart: Chart | null = null;
  chartInitialized = false;

  private destroy$ = new Subject<void>();

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.subscribeToCharacterUpdates();
    // Load characters initially
    this.characterService.loadCharacters().subscribe({
      error: (err) => {
        this.error = err || 'Veri yüklenirken hata oluştu';
        this.loading = false;
      }
    });
  }

  ngAfterViewInit() {
    // Chart canvas is now available
    this.chartInitialized = true;
    if (this.characters.length > 0) {
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        this.updateChart();
      }, 100);
    }
  }

  subscribeToCharacterUpdates() {
    // Subscribe to real-time character updates
    this.characterService.characters$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.characters = data;
          this.loading = false; // Set loading to false when we get data

          if (this.chartInitialized && data.length > 0) {
            // Update chart when characters change
            setTimeout(() => {
              this.updateChart();
            }, 100);
          }
        }
      });

    // Subscribe to loading state
    this.characterService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isLoading) => {
          this.loading = isLoading;
        }
      });

    // Subscribe to error state
    this.characterService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (error) => {
          this.error = error;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up chart
    if (this.chart) {
      this.chart.destroy();
    }
  }



  onChartTypeChange() {
    this.updateChart();
  }

  onDataTypeChange() {
    this.updateChart();
  }

  updateChart() {
    if (!this.chartInitialized || !this.chartCanvas || this.characters.length === 0) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const data = this.getChartData();
    const config = this.getChartConfig(data);

    try {
      this.chart = new Chart(this.chartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Chart creation error:', error);
    }
  }

  private getChartData() {
    const counts: Record<string, number> = {};

    this.characters.forEach(char => {
      let key: string;
      switch (this.selectedDataType) {
        case 'gender':
          key = char.gender || 'Unknown';
          break;
        case 'species':
          key = char.species || 'Unknown';
          break;
        case 'occupation':
          key = char.occupation || 'Unknown';
          break;
        default:
          key = 'Unknown';
      }
      counts[key] = (counts[key] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    return { labels, values };
  }

  private getColorsForLabels(labels: string[]): string[] {
    const colors: string[] = [];

    for (const label of labels) {
      if (this.selectedDataType === 'gender') {
        // Gender-specific colors: Male = Blue, Female = Pink
        if (label.toLowerCase() === 'male' || label.toLowerCase() === 'erkek') {
          colors.push('#2196F3'); // Blue for male
        } else if (label.toLowerCase() === 'female' || label.toLowerCase() === 'kadın') {
          colors.push('#E91E63'); // Pink for female
        } else {
          colors.push('#9E9E9E'); // Gray for unknown
        }
      } else {
        // Default colors for other data types
        const defaultColors = [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF8C00', '#C9CBCF', '#32CD32', '#FF1493'
        ];
        const index = labels.indexOf(label);
        colors.push(defaultColors[index % defaultColors.length]);
      }
    }

    return colors;
  }

  private getChartConfig(data: { labels: string[], values: number[] }): ChartConfiguration {
    // Get colors based on data type and labels
    const backgroundColor = this.getColorsForLabels(data.labels);
    const borderColor = backgroundColor;

    const dataset: any = {
      label: this.getDataTypeLabel(),
      data: data.values,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderWidth: 1
    };

    // Line chart specific properties
    if (this.selectedChartType === 'line') {
      dataset.fill = false;
      dataset.tension = 0.1;
      dataset.backgroundColor = backgroundColor[0];
      dataset.borderColor = borderColor[0];
    }

    const baseConfig: ChartConfiguration = {
      type: this.selectedChartType as ChartType,
      data: {
        labels: data.labels,
        datasets: [dataset]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${this.getDataTypeLabel()} Dağılımı`,
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: this.selectedChartType === 'pie' ? 'bottom' : 'top'
          }
        }
      }
    };

    // Add scales for bar and line charts
    if (this.selectedChartType === 'bar' || this.selectedChartType === 'line') {
      baseConfig.options!.scales = {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Karakter Sayısı'
          }
        },
        x: {
          title: {
            display: true,
            text: this.getDataTypeLabel()
          }
        }
      };
    }

    return baseConfig;
  }

  getDataTypeLabel(): string {
    switch (this.selectedDataType) {
      case 'gender': return 'Cinsiyet';
      case 'species': return 'Tür';
      case 'occupation': return 'Meslek';
      default: return 'Veri';
    }
  }

  getChartTypeLabel(): string {
    switch (this.selectedChartType) {
      case 'pie': return 'Pasta Grafik';
      case 'bar': return 'Çubuk Grafik';
      case 'line': return 'Çizgi Grafik';
      default: return 'Grafik';
    }
  }

  getMaleCount(): number {
    return this.characters.filter(char => char.gender?.toLowerCase() === 'male').length;
  }

  getFemaleCount(): number {
    return this.characters.filter(char => char.gender?.toLowerCase() === 'female').length;
  }
}
