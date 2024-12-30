import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import {useGeographic} from "ol/proj";
import {Coordinate} from "ol/coordinate";
import {GeoserverService} from "../services/geoserver.service";
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector";
import {Icon, Style} from "ol/style";
import {Feature, Overlay} from "ol";
import {FeatureLike} from "ol/Feature";
import {MultiPoint} from "ol/geom";

enum IconCode {
  'ME' = 0,
  'WORK'=1,
  'SCHOOL'=2
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement') mapElement!: ElementRef;
  @ViewChild('iconContainer', { static: true }) iconContainer!: ElementRef;

  map!: Map;
  mapCenter: Coordinate = [20.26216352, 63.8245844] // Umeå
  overlays: { overlay: Overlay, minZoom: number, maxZoom: number }[] = [];
  startingZoomLevel: number = 8;


  constructor(
    private geoserverService: GeoserverService
  ) { }

  ngAfterViewInit(): void {
    this.initMap();
    this.map.on("click", function (e) {
        console.log(e.originalEvent)
      // const pixel = this.map.getEventPixel(e.originalEvent);
      // const hit = map.hasFeatureAtPixel(pixel);
      // map.getTarget().style.cursor = hit ? 'pointer' : '';
      }
    )
    this.loadGeoJSONData();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  private initMap(): void {
    let osmBaseMap = this.geoserverService.getOsmBaseMap();
    let background = this.geoserverService.getTileLayer('tiger:giant_polygon');
    let worldMap = this.geoserverService.getSingleImageLayer('ne:world');
    let populatedPlaces = this.geoserverService.getSingleImageLayer('ne:populated_places');
    let coastlines = this.geoserverService.getTileLayer('ne:coastlines');
    let aboutMe = this.geoserverService.getTileLayer('personalsite:aboutMe');

    useGeographic()
    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [
        // background,
        osmBaseMap,
        // worldMap,
        // coastlines,
        // populatedPlaces
      ],
      view: new View({
        center: this.mapCenter,
        zoom: this.startingZoomLevel
      }),
    });
    this.map.on('moveend', this.updateOverlayVisibility.bind(this));
  }

  loadGeoJSONData(): void {
    this.geoserverService.getGeoJSON(
      'aboutMe',
      "personalsite",
      "http://personalsite",
      'EPSG:4326'
    ).subscribe((data) => {
      let features = new GeoJSON().readFeatures(data);
      features.forEach(feature=>{
        this.multipointToMarker(feature);
      })
      this.updateOverlayVisibility()
      this.createNavigationIcons(features);
    });
  }

  private multipointToMarker(feature: Feature) {
    let iconUrl: string;
    let minZoom: number = 12;
    let size: number | undefined = undefined;

    switch (feature.get('icon')) {
      case IconCode.ME:
        iconUrl = '/assets/map-assets/me.gif';
        minZoom = 2;
        break;
      case IconCode.WORK:
        iconUrl = '/assets/map-assets/work.gif';
        size = 80;
        break;
      case IconCode.SCHOOL:
        iconUrl = '/assets/map-assets/school.gif';
        size = 65;
        break;
      default:
        iconUrl = '/assets/map-assets/default.gif'
    }

    let marker = this.createMarker(feature, iconUrl, size);
    this.map.addOverlay(marker);
    this.overlays.push({overlay: marker, minZoom: minZoom, maxZoom: 99});
  }

  private updateOverlayVisibility(): void {
    const zoom = this.map.getView().getZoom();
    this.overlays.forEach(overlay => {
      const element = overlay.overlay.getElement();
      if (
        zoom !== undefined && element != undefined &&
        (zoom < overlay.minZoom || zoom > overlay.maxZoom)
      ) {
        element.style.display = 'none';
      } else if (element != undefined){
        element.style.display = 'block';
      }
    });
  }

  createMarker(feature: FeatureLike, iconUrl: string, size: number=100): Overlay {
    let coord;
    let properties = feature.getProperties();
    let multipoint = properties["geometry"] as MultiPoint;
    multipoint.getPoints().forEach(p => coord = p.getCoordinates());
    let id: string = properties["id"];

    const markerElement = document.createElement('div');
    markerElement.id = id;
    markerElement.className = 'marker';
    markerElement.style.backgroundImage = `url(${iconUrl})`;
    markerElement.style.backgroundRepeat = 'no-repeat';
    markerElement.style.backgroundPosition = 'center';
    markerElement.style.height = size+"px";
    markerElement.style.width = size+"px";
    markerElement.style.backgroundSize = "cover";

    return new Overlay({
      position: coord,
      positioning: 'center-center',
      element: markerElement,
      stopEvent: false
    });
  }

  getMarkerCoordinates(markerId: string): Coordinate | undefined {
    for (const overlayObj of this.overlays) {
      const markerElement = overlayObj.overlay.getElement();
      if (markerElement && markerElement.id == markerId) {
        return overlayObj.overlay.getPosition() as Coordinate;
      }
    }
    return undefined;
  }

  zoomToLocation(coordinate: Coordinate | undefined, zoomLevel: number): void {
    // console.log("coordinate")
    // console.log(coordinate)
    if(coordinate != undefined){
      this.map.getView().animate({
        center: coordinate,
        zoom: zoomLevel,
        duration: 1000
      });
    }
  }

  private createNavigationIcons(features: Feature[]): void {
    const iconContainer = this.iconContainer.nativeElement;
    iconContainer.innerHTML = '';

    features.forEach(feature => {
      const properties = feature.getProperties();
      const id = properties["id"];
      let iconUrl: string;

      switch (properties['icon']) {
        case IconCode.ME:
          iconUrl = '/assets/map-assets/me.gif';
          break;
        case IconCode.WORK:
          iconUrl = '/assets/map-assets/work.gif';
          break;
        case IconCode.SCHOOL:
          iconUrl = '/assets/map-assets/school.gif';
          break;
        default:
          iconUrl = '/assets/map-assets/default.gif';
      }

      const iconElement = document.createElement('div');
      iconElement.className = 'map-icon';
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      iconElement.style.backgroundRepeat = 'no-repeat';
      iconElement.style.backgroundPosition = 'center';
      iconElement.style.height = '50px';
      iconElement.style.width = '50px';
      iconElement.style.backgroundSize = 'cover';
      iconElement.style.margin = '5px';

      iconElement.addEventListener('click', () => {
        console.log(id);
        this.zoomToLocation(this.getMarkerCoordinates(id), 16)
      });

      iconContainer.appendChild(iconElement);
    });
  }

  private getVectorLayer<FeatureType>(data: any, srs: string = 'EPSG:4326') {
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(data, {featureProjection: srs})
    });

    return new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const iconType = feature.get('icon');
        let iconUrl = '../../assets/map-assets/home.png';
        if (iconType === 0) {
          iconUrl = '../../assets/map-assets/me.gif';
        } else if (iconType === 1) {
          iconUrl = '../../assets/map-assets/work.png';
        }

        return new Style({
          image: new Icon({
            width: 50,
            anchor: [0.5, 1],
            src: iconUrl
          })
        })
      }
    });
  }

}
