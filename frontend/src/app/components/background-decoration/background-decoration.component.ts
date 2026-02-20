import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Decoration {
  symbol: string; left: number; top: number; size: number;
  opacity: number; rotation: number; animationDelay: number;
  animationDuration: number; color: string;
}

@Component({
  selector: 'app-background-decoration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="decoration-container">
      <style>@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-15px) } }</style>
      <div *ngFor="let d of decorations" class="decoration-item"
        [style.left.%]="d.left" [style.top.%]="d.top" [style.font-size.px]="d.size"
        [style.color]="d.color" [style.opacity]="d.opacity"
        [style.animation]="'float ' + d.animationDuration + 's ease-in-out infinite'"
        [style.animation-delay.s]="d.animationDelay" [style.transform]="'rotate(' + d.rotation + 'deg)'">
        {{ d.symbol }}
      </div>
    </div>`,
  styles: [`.decoration-container { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 0; overflow: hidden; }
    .decoration-item { position: absolute; font-family: system-ui, sans-serif; font-weight: 600; user-select: none;
      will-change: transform; text-shadow: 0 3px 15px rgba(255,112,67,.6), 0 1px 3px rgba(255,112,67,.4);
      line-height: 1; -webkit-font-smoothing: antialiased; }`]
})
export class BackgroundDecorationComponent implements OnInit {
  decorations: Decoration[] = [];

  ngOnInit() {
    const symbols = ['+', '-', '%'];
    const colors = ['#FF9E80', '#FFAB91', '#FFB380', '#FF8A65', '#FF8A80', '#FFA07A', '#FFB3A7'];
    const placed: { left: number; top: number }[] = [];
    const minDist = 12;
    const rand = (min: number, range: number) => min + Math.random() * range;
    const tooClose = (l: number, t: number) =>
      placed.some(p => Math.sqrt((l - p.left) ** 2 + (t - p.top) ** 2) < minDist);

    let attempts = 0;
    while (this.decorations.length < 25 && attempts++ < 300) {
      let [left, top, tries] = [Math.random() * 100, Math.random() * 100, 0];
      while (tooClose(left, top) && tries++ < 50) [left, top] = [Math.random() * 100, Math.random() * 100];
      if (!tooClose(left, top)) {
        this.decorations.push({
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          left, top, size: rand(35, 25), opacity: rand(0.12, 0.12),
          rotation: rand(0, 360), animationDelay: rand(0, 20), animationDuration: rand(15, 10)
        });
        placed.push({ left, top });
      }
    }
  }
}