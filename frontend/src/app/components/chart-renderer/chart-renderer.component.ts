import { Component, Input, OnInit, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chart-renderer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatSelectModule, MatFormFieldModule, MatIconModule, FormsModule],
  template: `
    <mat-card class="chart-card">
      <mat-card-header class="chart-header">
        <mat-card-title class="chart-title">
          <mat-icon style="font-size:20px;width:20px;height:20px;margin-right:8px;color:#FF8A65">bar_chart</mat-icon>
          Data Visualization
        </mat-card-title>
      </mat-card-header>
      <mat-card-content class="chart-content">
        <div *ngIf="!data?.length" class="chart-empty-state">
          <mat-icon style="font-size:48px;width:48px;height:48px;color:rgba(255,138,101,.3);margin-bottom:12px">show_chart</mat-icon>
          <p>No data available for chart</p>
        </div>
        <div *ngIf="data?.length" class="chart-wrapper">
          <div class="chart-controls">
            <mat-form-field class="control-field">
              <mat-label>Chart Type</mat-label>
              <mat-select [(ngModel)]="chartType" (selectionChange)="updateChart()">
                <mat-option value="bar">Bar Chart</mat-option>
                <mat-option value="line">Line Chart</mat-option>
                <mat-option value="pie">Pie Chart</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngIf="allColumns.length" class="control-field">
              <mat-label>X-Axis</mat-label>
              <mat-select [(ngModel)]="xAxis" (selectionChange)="updateChart()">
                <mat-option *ngFor="let col of allColumns" [value]="col">{{ col }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngIf="numericColumns.length" class="control-field">
              <mat-label>Y-Axis</mat-label>
              <mat-select [(ngModel)]="yAxis" (selectionChange)="updateChart()">
                <mat-option *ngFor="let col of numericColumns" [value]="col">{{ col }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="chart-display-container">
            <ng-container *ngIf="chartType === 'bar' && xAxis && yAxis">
              <svg [attr.viewBox]="vb" style="width:100%;height:100%;display:block;overflow:visible">
                <g *ngFor="let tick of yTicks">
                  <line [attr.x1]="ML" [attr.y1]="yPos(tick)" [attr.x2]="svgWidth-MR" [attr.y2]="yPos(tick)" stroke="#E8E8E8" stroke-width="1" stroke-dasharray="4,3"/>
                  <text [attr.x]="ML-8" [attr.y]="yPos(tick)" text-anchor="end" dominant-baseline="middle" style="font-size:11px;fill:#777;font-family:sans-serif">{{ formatYLabel(tick) }}</text>
                </g>
                <line [attr.x1]="ML" [attr.y1]="MT" [attr.x2]="ML" [attr.y2]="svgHeight-MB" stroke="#BDBDBD" stroke-width="1.5"/>
                <line [attr.x1]="ML" [attr.y1]="svgHeight-MB" [attr.x2]="svgWidth-MR" [attr.y2]="svgHeight-MB" stroke="#BDBDBD" stroke-width="1.5"/>
                <text [attr.x]="14" [attr.y]="MT+plotH/2" text-anchor="middle" dominant-baseline="middle" [attr.transform]="yTitleT" style="font-size:12px;fill:#555;font-weight:600;font-family:sans-serif">{{ yAxis }}</text>
                <text [attr.x]="ML+plotW/2" [attr.y]="svgHeight-6" text-anchor="middle" style="font-size:12px;fill:#555;font-weight:600;font-family:sans-serif">{{ xAxis }}</text>
                <g *ngFor="let item of chartData; let i = index">
                  <rect [attr.x]="barX(i)" [attr.y]="yPos(item.value)" [attr.width]="barW" [attr.height]="barH(item.value)"
                    [attr.fill]="hoveredIndex===i ? '#42A5F5' : '#64B5F6'" rx="3" style="cursor:pointer;transition:fill .2s"
                    (mouseenter)="hoveredIndex=i" (mouseleave)="hoveredIndex=-1"/>
                  <text [attr.x]="barX(i)+barW/2" [attr.y]="yPos(item.value)-5" text-anchor="middle" style="font-size:11px;fill:#333;font-weight:600;font-family:sans-serif;pointer-events:none">{{ formatValue(item.value) }}</text>
                  <text [attr.x]="barX(i)+barW/2" [attr.y]="svgHeight-MB+8" text-anchor="end" dominant-baseline="hanging"
                    [attr.transform]="'rotate(-40,'+(barX(i)+barW/2)+','+(svgHeight-MB+8)+')'" style="font-size:11px;fill:#555;font-family:sans-serif">{{ truncate(item.label,14) }}</text>
                </g>
              </svg>
            </ng-container>

            <ng-container *ngIf="chartType === 'line' && xAxis && yAxis">
              <svg [attr.viewBox]="vb" style="width:100%;height:100%;display:block;overflow:visible">
                <g *ngFor="let tick of yTicks">
                  <line [attr.x1]="ML" [attr.y1]="yPos(tick)" [attr.x2]="svgWidth-MR" [attr.y2]="yPos(tick)" stroke="#E8E8E8" stroke-width="1" stroke-dasharray="4,3"/>
                  <text [attr.x]="ML-8" [attr.y]="yPos(tick)" text-anchor="end" dominant-baseline="middle" style="font-size:11px;fill:#777;font-family:sans-serif">{{ formatYLabel(tick) }}</text>
                </g>
                <line [attr.x1]="ML" [attr.y1]="MT" [attr.x2]="ML" [attr.y2]="svgHeight-MB" stroke="#BDBDBD" stroke-width="1.5"/>
                <line [attr.x1]="ML" [attr.y1]="svgHeight-MB" [attr.x2]="svgWidth-MR" [attr.y2]="svgHeight-MB" stroke="#BDBDBD" stroke-width="1.5"/>
                <text [attr.x]="14" [attr.y]="MT+plotH/2" text-anchor="middle" dominant-baseline="middle" [attr.transform]="yTitleT" style="font-size:12px;fill:#555;font-weight:600;font-family:sans-serif">{{ yAxis }}</text>
                <text [attr.x]="ML+plotW/2" [attr.y]="svgHeight-6" text-anchor="middle" style="font-size:12px;fill:#555;font-weight:600;font-family:sans-serif">{{ xAxis }}</text>
                <polyline [attr.points]="linePoints" fill="none" stroke="#FF8A65" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                <g *ngFor="let item of chartData; let i = index">
                  <circle [attr.cx]="lineX(i)" [attr.cy]="yPos(item.value)" [attr.r]="hoveredIndex===i ? 6 : 4"
                    fill="#FF8A65" stroke="#fff" stroke-width="2" style="cursor:pointer;transition:r .15s"
                    (mouseenter)="hoveredIndex=i" (mouseleave)="hoveredIndex=-1"/>
                  <text *ngIf="hoveredIndex===i" [attr.x]="lineX(i)" [attr.y]="yPos(item.value)-12"
                    text-anchor="middle" style="font-size:11px;fill:#333;font-weight:600;font-family:sans-serif;pointer-events:none">{{ formatValue(item.value) }}</text>
                  <text [attr.x]="lineX(i)" [attr.y]="svgHeight-MB+8" text-anchor="end" dominant-baseline="hanging"
                    [attr.transform]="'rotate(-40,'+lineX(i)+','+(svgHeight-MB+8)+')'" style="font-size:11px;fill:#555;font-family:sans-serif">{{ truncate(item.label,14) }}</text>
                </g>
              </svg>
            </ng-container>

            <ng-container *ngIf="chartType === 'pie' && xAxis && yAxis">
              <svg [attr.viewBox]="vb" style="width:100%;height:100%;display:block">
                <g [attr.transform]="'translate('+piecx+','+piecy+')'">
                  <g *ngFor="let item of chartData; let i = index">
                    <path [attr.d]="pieSlice(i)" [attr.fill]="pieColor(i)" stroke="#fff" stroke-width="2"
                      style="cursor:pointer;transition:opacity .2s" [style.opacity]="hoveredIndex===-1||hoveredIndex===i ? '1' : '0.6'"
                      (mouseenter)="hoveredIndex=i" (mouseleave)="hoveredIndex=-1"/>
                    <text *ngIf="item.value/totalValue > 0.05" [attr.x]="pieLabelX(i,pieR*.62)" [attr.y]="pieLabelY(i,pieR*.62)"
                      text-anchor="middle" dominant-baseline="middle" style="font-size:12px;fill:#fff;font-weight:700;font-family:sans-serif;pointer-events:none">{{ pct(item.value) }}%</text>
                  </g>
                </g>
                <g *ngFor="let item of chartData; let i = index" [attr.transform]="'translate('+(svgWidth-MR-160)+','+(MT+i*22)+')'">
                  <rect width="12" height="12" [attr.fill]="pieColor(i)" rx="2"/>
                  <text x="18" y="10" dominant-baseline="middle" style="font-size:11px;fill:#444;font-family:sans-serif">{{ truncate(item.label,16) }} ({{ formatValue(item.value) }})</text>
                </g>
              </svg>
            </ng-container>

            <div *ngIf="!xAxis || !yAxis" style="text-align:center;padding:20px;color:rgba(0,0,0,.45)">
              <p style="font-size:14px">Select chart type and axes to visualize data</p>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>`,
  styles: [`
    .chart-card { border-radius:16px !important; border:1px solid rgba(255,179,167,.3) !important; box-shadow:0 4px 12px rgba(255,138,101,.1) !important; background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(255,248,245,.95)) !important; backdrop-filter:blur(10px); height:100%; display:flex; flex-direction:column; transition:all .3s; }
    .chart-card:hover { box-shadow:0 6px 16px rgba(255,138,101,.15) !important; transform:translateY(-2px); }
    .chart-header { padding:16px 20px 12px !important; background:linear-gradient(135deg,rgba(255,248,245,.8),rgba(255,230,220,.8)); border-bottom:1px solid rgba(255,179,167,.2); }
    .chart-title { font-size:18px !important; font-weight:600 !important; color:#4A5568 !important; margin:0 !important; display:flex; align-items:center; }
    .chart-content { flex:1; padding:16px 20px 20px !important; display:flex; flex-direction:column; min-height:0; }
    .chart-empty-state { text-align:center; padding:40px 20px; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:rgba(0,0,0,.5); font-size:14px; }
    .chart-wrapper { flex:1; display:flex; flex-direction:column; min-height:0; }
    .chart-controls { margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap; padding:12px; background:linear-gradient(135deg,rgba(255,248,245,.5),rgba(255,230,220,.5)); border-radius:12px; border:1px solid rgba(255,179,167,.2); }
    .control-field { flex:1; min-width:140px; }
    ::ng-deep .control-field .mat-mdc-text-field-wrapper { background:white; border-radius:8px; border:1px solid rgba(255,179,167,.3); }
    ::ng-deep .control-field .mat-mdc-select-arrow { color:#FF8A65; }
    ::ng-deep .control-field .mdc-line-ripple::before { border-bottom-color:#FF8A65; }
    ::ng-deep .control-field .mdc-line-ripple::after  { border-bottom-color:#FF7043; }
    .chart-display-container { flex:1; min-height:320px; max-height:420px; display:flex; align-items:stretch; justify-content:center; width:100%; overflow:hidden; padding:12px; background:white; border-radius:12px; border:1px solid rgba(255,179,167,.2); box-shadow:inset 0 2px 4px rgba(0,0,0,.02); box-sizing:border-box; }
    .chart-display-container > ng-container, .chart-display-container > div { width:100%; height:100%; }
  `]
})
export class ChartRendererComponent implements OnInit, OnChanges, DoCheck {
  @Input() data: any[] = [];
  @Input() columns: string[] = [];

  chartType = 'bar'; xAxis = ''; yAxis = '';
  numericColumns: string[] = []; allColumns: string[] = [];
  chartData: { label: string; value: number }[] = [];
  hoveredIndex = -1;
  private prevHash = '';

  readonly svgWidth = 700; readonly svgHeight = 400;
  readonly MT = 30; readonly MB = 110; readonly ML = 70; readonly MR = 20;

  get plotW() { return this.svgWidth - this.ML - this.MR; }
  get plotH() { return this.svgHeight - this.MT - this.MB; }
  get vb()    { return `0 0 ${this.svgWidth} ${this.svgHeight}`; }
  get yTitleT() { return `rotate(-90, 14, ${this.MT + this.plotH / 2})`; }
  get pieR()  { return Math.min(this.plotW * 0.38, this.plotH * 0.45); }
  get piecx() { return this.ML + this.plotW * 0.35; }
  get piecy() { return this.MT + this.plotH / 2; }
  get barW()  { return Math.max(8, (this.plotW / (this.chartData.length || 1)) * 0.65); }
  get maxValue() { return this.chartData.length ? Math.max(...this.chartData.map(d => d.value), 0) : 1; }
  get minValue() { const m = this.chartData.length ? Math.min(...this.chartData.map(d => d.value), 0) : 0; return m >= 0 ? 0 : m; }
  get totalValue() { return this.chartData.reduce((s, d) => s + d.value, 0) || 1; }
  get linePoints() { return this.chartData.map((d, i) => `${this.lineX(i)},${this.yPos(d.value)}`).join(' '); }

  get yTicks(): number[] {
    const [max, min] = [this.maxValue, this.minValue];
    const rawStep = (max - min || 1) / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const n = rawStep / mag;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
    const ticks: number[] = [];
    for (let cur = Math.floor(min / step) * step; cur <= max + step * 0.5; cur += step) ticks.push(cur);
    return ticks;
  }

  barX(i: number)   { const s = this.plotW / (this.chartData.length || 1); return this.ML + i * s + (s - this.barW) / 2; }
  barH(v: number)   { return this.yPos(this.minValue) - this.yPos(v); }
  lineX(i: number)  { return this.chartData.length <= 1 ? this.ML + this.plotW / 2 : this.ML + (i / (this.chartData.length - 1)) * this.plotW; }
  yPos(v: number)   { return this.MT + this.plotH - ((v - this.minValue) / (this.maxValue - this.minValue || 1)) * this.plotH; }
  pct(v: number)    { return ((v / this.totalValue) * 100).toFixed(0); }
  truncate(s: string, max: number) { return s?.length > max ? s.substring(0, max - 1) + '…' : (s ?? ''); }

  private _pieAngles(i: number) {
    let angle = -Math.PI / 2;
    for (let j = 0; j < i; j++) angle += (this.chartData[j].value / this.totalValue) * 2 * Math.PI;
    const slice = (this.chartData[i].value / this.totalValue) * 2 * Math.PI;
    return { start: angle, end: angle + slice };
  }

  pieSlice(i: number) {
    const r = this.pieR, { start, end } = this._pieAngles(i);
    return `M0,0 L${r*Math.cos(start)},${r*Math.sin(start)} A${r},${r} 0 ${end-start>Math.PI?1:0},1 ${r*Math.cos(end)},${r*Math.sin(end)} Z`;
  }

  pieLabelX(i: number, r: number) { const { start, end } = this._pieAngles(i); return r * Math.cos((start + end) / 2); }
  pieLabelY(i: number, r: number) { const { start, end } = this._pieAngles(i); return r * Math.sin((start + end) / 2); }
  pieColor(i: number) { return ['#FF8A65','#FFB74D','#4FC3F7','#81C784','#BA68C8','#F06292','#FFD54F','#4DB6AC'][i % 8]; }

  formatYLabel(v: number) {
    if (Math.abs(v) >= 1e9) return (v/1e9).toFixed(1)+'B';
    if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(1)+'M';
    if (Math.abs(v) >= 1e3) return (v/1e3).toFixed(0)+'K';
    return v % 1 === 0 ? v.toString() : v.toFixed(1);
  }
  formatValue(v: number) {
    if (Math.abs(v) >= 1e9) return (v/1e9).toFixed(1)+'B';
    if (Math.abs(v) >= 1e6) return (v/1e6).toFixed(1)+'M';
    if (Math.abs(v) >= 1e3) return (v/1e3).toFixed(1)+'K';
    return v % 1 === 0 ? v.toString() : v.toFixed(2);
  }

  ngOnInit()  { this.initializeChart(); }
  ngOnChanges(changes: SimpleChanges) { if (changes['data'] || changes['columns']) this.initializeChart(); }
  ngDoCheck() {
    const hash = `${this.data?.length}|${JSON.stringify(this.data?.[0])}`;
    if (hash !== this.prevHash) { this.prevHash = hash; this.initializeChart(); }
  }

  initializeChart() {
    this.hoveredIndex = -1;
    this.allColumns = this.data?.length ? Object.keys(this.data[0]) : (this.columns ?? []);
    this.numericColumns = this.allColumns.filter(col => {
      const samples = this.data?.slice(0, 5).map(r => r[col]).filter(v => v != null) ?? [];
      return samples.length && samples.every(v => typeof v === 'number' || (!isNaN(parseFloat(String(v))) && isFinite(parseFloat(String(v)))));
    });
    if (!this.xAxis || !this.allColumns.includes(this.xAxis))
      this.xAxis = this.allColumns.filter(c => !this.numericColumns.includes(c))[0] ?? this.allColumns[0] ?? '';
    if (!this.yAxis || !this.numericColumns.includes(this.yAxis))
      this.yAxis = this.numericColumns.at(-1) ?? '';
    this.updateChart();
  }

  updateChart() {
    this.hoveredIndex = -1;
    if (!this.data?.length || !this.xAxis || !this.yAxis) { this.chartData = []; return; }
    this.chartData = this.data
      .map(row => ({ label: String(row[this.xAxis] ?? ''), value: typeof row[this.yAxis] === 'number' ? row[this.yAxis] : parseFloat(String(row[this.yAxis] ?? 'NaN')) }))
      .filter(d => d.label !== '' && !isNaN(d.value));
  }
}