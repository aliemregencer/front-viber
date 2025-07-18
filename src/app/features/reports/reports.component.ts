import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CharacterService, Character } from '../../core/services/character.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

Chart.register(...registerables);

interface ReportData {
  selectedCharacters: Character[];
  chartType: 'pie' | 'bar' | 'line';
  dataType: 'species' | 'occupation' | 'planet' | 'gender';
  language: 'tr' | 'en';
  generatedAt: Date;
}

interface Translation {
  [key: string]: {
    tr: string;
    en: string;
  };
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reportPreview', { static: false }) reportPreview!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();

  // Data
  allCharacters: Character[] = [];
  selectedCharacters: Character[] = [];
  loading = true;
  error: string | null = null;

  // Report settings
  chartType: 'pie' | 'bar' | 'line' = 'pie';
  dataType: 'species' | 'occupation' | 'planet' | 'gender' = 'species';
  language: 'tr' | 'en' = 'tr';

  // Chart
  chart: Chart | null = null;
  chartInitialized = false;

  // Report
  reportGenerated = false;
  reportData: ReportData | null = null;

  // Storage key
  private storageKey = 'reports-last-report';

  // Translations
  translations: Translation = {
    title: { tr: 'Karakter Analiz Raporu', en: 'Character Analysis Report' },
    generatedAt: { tr: 'Oluşturulma Tarihi', en: 'Generated At' },
    selectedCharacters: { tr: 'Seçilen Karakterler', en: 'Selected Characters' },
    summary: { tr: 'Özet', en: 'Summary' },
    analysis: { tr: 'Analiz', en: 'Analysis' },
    references: { tr: 'Kaynakça', en: 'References' },
    name: { tr: 'Ad', en: 'Name' },
    species: { tr: 'Tür', en: 'Species' },
    occupation: { tr: 'Meslek', en: 'Occupation' },
    planet: { tr: 'Gezegen', en: 'Planet' },
    gender: { tr: 'Cinsiyet', en: 'Gender' },
    age: { tr: 'Yaş', en: 'Age' },
    totalCharacters: { tr: 'Toplam Karakter', en: 'Total Characters' },
    distribution: { tr: 'Dağılım', en: 'Distribution' },
    chart: { tr: 'Grafik', en: 'Chart' },
    noCharactersSelected: { tr: 'Rapor oluşturmak için en az bir karakter seçin', en: 'Select at least one character to generate report' },
    selectAll: { tr: 'Tümünü Seç', en: 'Select All' },
    deselectAll: { tr: 'Tümünü Kaldır', en: 'Deselect All' },
    generateReport: { tr: 'Rapor Oluştur', en: 'Generate Report' },
    downloadPDF: { tr: 'PDF İndir', en: 'Download PDF' },
    downloadDOCX: { tr: 'Word İndir', en: 'Download Word' },
    loadLastReport: { tr: 'Son Raporu Yükle', en: 'Load Last Report' }
  };

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.loadCharacters();
    this.loadLastReport();
  }

  ngAfterViewInit() {
    this.chartInitialized = true;
    if (this.selectedCharacters.length > 0) {
      setTimeout(() => {
        this.updateChart();
      }, 100);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.chart) {
      this.chart.destroy();
    }
  }

  // Data loading
  loadCharacters() {
    this.characterService.characters$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (characters) => {
          this.allCharacters = characters;
          this.loading = false;
        }
      });

    this.characterService.loadCharacters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          this.error = err || 'Karakterler yüklenirken hata oluştu';
          this.loading = false;
        }
      });
  }

  // Character selection
  onCharacterSelect(character: Character, selected: boolean) {
    if (selected) {
      if (!this.selectedCharacters.find(c => c.id === character.id)) {
        this.selectedCharacters.push(character);
      }
    } else {
      this.selectedCharacters = this.selectedCharacters.filter(c => c.id !== character.id);
    }

    if (this.chartInitialized) {
      // Always call updateChart, it will handle empty state
      setTimeout(() => {
        this.updateChart();
      }, 50);
    }
  }

  isCharacterSelected(character: Character): boolean {
    return this.selectedCharacters.some(c => c.id === character.id);
  }

  selectAllCharacters() {
    this.selectedCharacters = [...this.allCharacters];
    if (this.chartInitialized) {
      setTimeout(() => {
        this.updateChart();
      }, 50);
    }
  }

  deselectAllCharacters() {
    this.selectedCharacters = [];
    if (this.chartInitialized) {
      setTimeout(() => {
        this.updateChart();
      }, 50);
    }
  }

  // Chart management
  onChartTypeChange() {
    if (this.chartInitialized) {
      setTimeout(() => {
        this.updateChart();
      }, 50);
    }
  }

  onDataTypeChange() {
    if (this.chartInitialized) {
      setTimeout(() => {
        this.updateChart();
      }, 50);
    }
  }

  updateChart() {
    if (!this.chartInitialized || !this.chartCanvas) {
      return;
    }

    // Always destroy existing chart first
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (error) {
        console.error('Error destroying chart:', error);
      }
      this.chart = null;
    }

    // If no characters selected, just return (empty state)
    if (this.selectedCharacters.length === 0) {
      return;
    }

    try {
      const data = this.getChartData();

      if (data.labels.length === 0 || data.data.length === 0) {
        return;
      }

      const config = this.getChartConfig(data);
      this.chart = new Chart(this.chartCanvas.nativeElement, config);
    } catch (error) {
      console.error('Chart creation error:', error);
      // Reset chart reference on error
      this.chart = null;
    }
  }

  private getChartData() {
    const counts: Record<string, number> = {};

    if (this.selectedCharacters.length === 0) {
      return { labels: [], data: [] };
    }

    this.selectedCharacters.forEach(char => {
      let value: string;
      switch (this.dataType) {
        case 'species':
          value = char.species || 'Unknown';
          break;
        case 'occupation':
          value = char.occupation || 'Unknown';
          break;
        case 'planet':
          value = char.homePlanet || 'Unknown';
          break;
        case 'gender':
          value = char.gender || 'Unknown';
          break;
        default:
          value = 'Unknown';
      }
      counts[value] = (counts[value] || 0) + 1;
    });

    return {
      labels: Object.keys(counts),
      data: Object.values(counts)
    };
  }

  private getColorsForLabels(labels: string[]): string[] {
    const colors: string[] = [];

    for (const label of labels) {
      if (this.dataType === 'gender') {
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

  private getChartConfig(data: { labels: string[], data: number[] }): ChartConfiguration {
    // Get colors based on data type and labels
    const backgroundColor = this.getColorsForLabels(data.labels);

    const baseConfig: ChartConfiguration = {
      type: this.chartType as ChartType,
      data: {
        labels: data.labels,
        datasets: [{
          label: this.t(this.dataType),
          data: data.data,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${this.t('distribution')} - ${this.t(this.dataType)}`
          },
          legend: {
            display: this.chartType === 'pie'
          }
        }
      }
    };

    if (this.chartType === 'line') {
      (baseConfig.data!.datasets[0] as any).fill = false;
      (baseConfig.data!.datasets[0] as any).tension = 0.1;
    }

    return baseConfig;
  }

  // Report generation
  generateReport() {
    if (this.selectedCharacters.length === 0) {
      return;
    }

    this.reportData = {
      selectedCharacters: [...this.selectedCharacters],
      chartType: this.chartType,
      dataType: this.dataType,
      language: this.language,
      generatedAt: new Date()
    };

    this.reportGenerated = true;
    this.saveLastReport();
  }

  // Get chart as base64 image
  getChartImage(): string {
    if (this.chart && this.chartCanvas) {
      return this.chart.toBase64Image();
    }
    return '';
  }

  // Helper method to format date safely
  private getFormattedDate(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString(this.language === 'tr' ? 'tr-TR' : 'en-US');
      }
      return new Date().toLocaleDateString(this.language === 'tr' ? 'tr-TR' : 'en-US');
    } catch (error) {
      console.error('Date formatting error:', error);
      return new Date().toLocaleDateString(this.language === 'tr' ? 'tr-TR' : 'en-US');
    }
  }

  // Translation helper
  t(key: string): string {
    return this.translations[key]?.[this.language] || key;
  }

  // Language change
  onLanguageChange() {
    if (this.chartInitialized && this.selectedCharacters.length > 0) {
      this.updateChart();
    }
  }

  // Storage management
  saveLastReport() {
    if (this.reportData) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.reportData));
    }
  }

  loadLastReport() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data: ReportData = JSON.parse(stored);

        // Validate that characters still exist
        const validCharacters = data.selectedCharacters.filter(char =>
          this.allCharacters.some(c => c.id === char.id)
        );

        if (validCharacters.length > 0) {
          this.selectedCharacters = validCharacters;
          this.chartType = data.chartType;
          this.dataType = data.dataType;
          this.language = data.language;

          // Ensure generatedAt is a proper Date object
          this.reportData = {
            ...data,
            generatedAt: typeof data.generatedAt === 'string' ? new Date(data.generatedAt) : data.generatedAt
          };
          this.reportGenerated = true;

          if (this.chartInitialized) {
            setTimeout(() => {
              this.updateChart();
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('Error loading last report:', error);
    }
  }

  hasLastReport(): boolean {
    return !!localStorage.getItem(this.storageKey);
  }

  // PDF Download
  async downloadPDF() {
    if (!this.reportData || !this.reportPreview) {
      return;
    }

    try {
      const element = this.reportPreview.nativeElement;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `character-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  }

  // DOCX Download - Alternative approach using HTML to RTF
  async downloadDOCX() {
    if (!this.reportData) {
      alert('Önce rapor oluşturun');
      return;
    }

    try {
      // Create RTF content (Rich Text Format) which can be opened by Word
      const rtfContent = this.generateRTFContent();

      const fileName = `character-report-${new Date().toISOString().split('T')[0]}.rtf`;
      const blob = new Blob([rtfContent], {
        type: 'application/rtf'
      });

      saveAs(blob, fileName);
    } catch (error) {
      console.error('RTF generation error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      console.error('Error details:', errorMessage);
      alert('Dosya oluşturulurken hata oluştu: ' + errorMessage);
    }
  }

  // Generate RTF content that can be opened by Microsoft Word
  private generateRTFContent(): string {
    const date = this.getFormattedDate(this.reportData!.generatedAt);

    let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';

    // Title
    rtf += '\\f0\\fs28\\b ' + this.t('title') + '\\b0\\par\\par';

    // Generated date
    rtf += '\\fs20\\i ' + this.t('generatedAt') + ': ' + date + '\\i0\\par\\par';

    // Selected characters section
    rtf += '\\fs24\\b ' + this.t('selectedCharacters') + ' (' + this.selectedCharacters.length + ')\\b0\\par';

    // Characters list
    this.reportData!.selectedCharacters.forEach(char => {
      rtf += '\\bullet ' + char.name.first + ' ' + char.name.last + ' - ' +
             char.species + ' - ' + char.occupation + ' - ' + char.homePlanet + '\\par';
    });

    rtf += '\\par';

    // Chart info (if available)
    if (this.getChartImage()) {
      rtf += '\\fs24\\b ' + this.t('distribution') + ' - ' + this.t(this.dataType) + '\\b0\\par';
      rtf += '[' + this.t('distribution') + ' ' + this.t('chart') + ' - ' + this.chartType.toUpperCase() + ']\\par\\par';
    }

    // Analysis section
    rtf += '\\fs24\\b ' + this.t('analysis') + '\\b0\\par';
    rtf += this.generateAnalysisText() + '\\par\\par';

    // References section
    rtf += '\\fs24\\b ' + this.t('references') + '\\b0\\par';
    rtf += 'Futurama Character Database. (2024). Retrieved from https://api.sampleapis.com/futurama/characters\\par';

    rtf += '}';

    return rtf;
  }

  // Analysis text generation
  generateAnalysisText(): string {
    if (!this.reportData) return '';

    const chars = this.reportData.selectedCharacters;
    const total = chars.length;

    // Species analysis
    const speciesCount = chars.reduce((acc, char) => {
      const species = char.species || 'Unknown';
      acc[species] = (acc[species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonSpecies = Object.entries(speciesCount)
      .sort(([,a], [,b]) => b - a)[0];

    // Occupation analysis
    const occupationCount = chars.reduce((acc, char) => {
      const occupation = char.occupation || 'Unknown';
      acc[occupation] = (acc[occupation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonOccupation = Object.entries(occupationCount)
      .sort(([,a], [,b]) => b - a)[0];

    // Planet analysis
    const planetCount = chars.reduce((acc, char) => {
      const planet = char.homePlanet || 'Unknown';
      acc[planet] = (acc[planet] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonPlanet = Object.entries(planetCount)
      .sort(([,a], [,b]) => b - a)[0];

    if (this.language === 'tr') {
      return `Bu rapor ${total} karakterin analizini içermektedir. ` +
             `En yaygın tür ${mostCommonSpecies[0]} (${mostCommonSpecies[1]} karakter, %${Math.round((mostCommonSpecies[1]/total)*100)})'dir. ` +
             `En yaygın meslek ${mostCommonOccupation[0]} (${mostCommonOccupation[1]} karakter, %${Math.round((mostCommonOccupation[1]/total)*100)})'tir. ` +
             `Karakterlerin çoğu ${mostCommonPlanet[0]} gezegeninden gelmektedir (${mostCommonPlanet[1]} karakter, %${Math.round((mostCommonPlanet[1]/total)*100)}). ` +
             `Bu veriler, seçilen karakter grubunun demografik özelliklerini ve dağılımını göstermektedir.`;
    } else {
      return `This report contains analysis of ${total} characters. ` +
             `The most common species is ${mostCommonSpecies[0]} (${mostCommonSpecies[1]} characters, ${Math.round((mostCommonSpecies[1]/total)*100)}%). ` +
             `The most common occupation is ${mostCommonOccupation[0]} (${mostCommonOccupation[1]} characters, ${Math.round((mostCommonOccupation[1]/total)*100)}%). ` +
             `Most characters are from ${mostCommonPlanet[0]} (${mostCommonPlanet[1]} characters, ${Math.round((mostCommonPlanet[1]/total)*100)}%). ` +
             `This data shows the demographic characteristics and distribution of the selected character group.`;
    }
  }

  // Character analysis helper
  getCharacterAnalysis(character: Character): string {
    const analyses: Record<string, Record<string, string>> = {
      tr: {
        'Zoidberg': 'Gezegenler arası medikal görevlerde öne çıkar.',
        'Fry': 'Zaman yolculuğu deneyimi olan nadir karakterlerden biridir.',
        'Leela': 'Liderlik yetenekleri ve pilotluk becerileri dikkat çekicidir.',
        'Bender': 'Robot teknolojisinin gelişmiş bir örneğidir.',
        'default': 'Futurama evreninin önemli karakterlerinden biridir.'
      },
      en: {
        'Zoidberg': 'Stands out in interplanetary medical missions.',
        'Fry': 'One of the rare characters with time travel experience.',
        'Leela': 'Leadership abilities and piloting skills are remarkable.',
        'Bender': 'An advanced example of robot technology.',
        'default': 'One of the important characters in the Futurama universe.'
      }
    };

    const firstName = character.name.first;
    const languageAnalyses = analyses[this.language] || analyses['tr'];
    return languageAnalyses[firstName] || languageAnalyses['default'];
  }
}
