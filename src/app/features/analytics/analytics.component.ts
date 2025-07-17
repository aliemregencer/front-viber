import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CharacterService, Character } from '../../core/services/character.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  characters: Character[] = [];
  loading = true;
  error: string | null = null;

  selectedChartType: 'pie' | 'bar' | 'line' = 'pie';
  selectedDataType: 'gender' | 'species' | 'occupation' = 'gender';

  chart: Chart | null = null;
  chartInitialized = false;

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.loadData();
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

  loadData() {
    this.loading = true;
    this.characterService.loadCharacters().subscribe({
      next: (data) => {
        this.characters = data;
        this.loading = false;
        if (this.chartInitialized) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            this.updateChart();
          }, 100);
        }
      },
      error: (err) => {
        this.error = err || 'Veri yüklenirken hata oluştu';
        this.loading = false;
      }
    });
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

  private getChartConfig(data: { labels: string[], values: number[] }): ChartConfiguration {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF8C00', '#C9CBCF', '#32CD32', '#FF1493'
    ];

    const dataset: any = {
      label: this.getDataTypeLabel(),
      data: data.values,
      backgroundColor: colors.slice(0, data.labels.length),
      borderColor: colors.slice(0, data.labels.length),
      borderWidth: 1
    };

    // Line chart specific properties
    if (this.selectedChartType === 'line') {
      dataset.fill = false;
      dataset.tension = 0.1;
      dataset.backgroundColor = colors[0];
      dataset.borderColor = colors[0];
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
