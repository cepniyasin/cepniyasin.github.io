import { Injectable } from '@angular/core';
import TileLayer from "ol/layer/Tile";
import {ImageWMS, OSM, TileWMS} from "ol/source";
import ImageLayer from "ol/layer/Image";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {GeoJSON, WFS} from "ol/format";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeoserverService {

  constructor(private http: HttpClient) { }

  public getOsmBaseMap() {
    return new TileLayer({
      source: new OSM({
        wrapX: true,
        // attributions: ['© Acme Inc.', '© Bacme Inc.']
      }),
    });
  }

  public getTileLayer(layers: string): TileLayer<TileWMS> {
    return new TileLayer({
      // extent: [-13884991, 2870341, -7455066, 6338219],
      source: new TileWMS({
        url: environment.geoserverURL + "wms",
        params: {'LAYERS': layers, 'TILED': true},
        serverType: 'geoserver',
        transition: 0,
      }),
    });
  }

  public getSingleImageLayer (layers: string){
    return  new ImageLayer({
      source: new ImageWMS({
        url: environment.geoserverURL + "wms",
        params: {'LAYERS': layers},
        ratio: 1,
        serverType: 'geoserver',
      }),
    })
  }

  getGeoJSON(layerName: string,
             workspace: string,
             namespace: string,
             srs: string,
             bbox?: number[]
  ): Observable<any> {
    const wfs: WFS = new WFS();
    const featureRequest = wfs.writeGetFeature({
      srsName: srs,
      featureNS: namespace,
      featurePrefix: workspace,
      featureTypes: [layerName],
      outputFormat: 'application/json',
      bbox: bbox,
    });

    const serializer = new XMLSerializer();
    const xmlStr = serializer.serializeToString(featureRequest);

    return this.http.post(environment.geoserverURL+"wfs", xmlStr, {
      headers: { 'Content-Type': 'application/xml' },
      responseType: 'text'
    }).pipe(
      map(response => {
        return response;
      })
    );
  }
}
