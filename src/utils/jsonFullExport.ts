export type JsonFullExport = {
  images: string[];
  transparenciesMap: {
    [imageName: string]: {
      colour: {
        r: number;
        g: number;
        b: number;
      };
      threshold: number;
    }[];
  };
  _grid?: {
    [imageName: string]: {
      name: string;
      position: {
        x: number;
        y: number;
      };
      padding: {
        x: number;
        y: number;
      };
      dimensions: {
        x: number;
        y: number;
      };
      grid: {
        x: number;
        y: number;
      };
    }[];
  },
  animations: {
    name: string;
    fps: number;
    loop: boolean;
    pingPong: {
      noFirst: boolean;
      noLast: boolean;
    } | null;
    transform: {
      rotation: 90 | 180 | 270 | null;
      mirror: {
        x: boolean;
        y: boolean;
      } | null;
    } | null;
    frameDimensions: {
      w: number;
      h: number;
    };
    frames: {
      i: number;
      d: number;
      t: {
        r: 90 | 180 | 270 | null;
        m: {
          x: boolean;
          y: boolean;
        } | null;
      } | null;
      b: {
        x: number;
        y: number;
        w: number;
        h: number;
      };
      o: {
        x: number;
        y: number;
      };
    }[];
    framesLength: number;
    _colLim?: number;
    _pad?: number;
  }[];
}