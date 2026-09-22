import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { GalleryComponent } from "./app/gallery/gallery.component";
const hostStyles = document.createElement("link");
hostStyles.rel = "stylesheet";
hostStyles.href = "/gallery-host.css";
document.head.append(hostStyles);
bootstrapApplication(GalleryComponent, appConfig).catch((error) => console.error(error));
