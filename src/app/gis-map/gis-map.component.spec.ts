import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GisMapComponent } from './gis-map.component';

describe('GisMapComponent', () => {
  let component: GisMapComponent;
  let fixture: ComponentFixture<GisMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GisMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GisMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
