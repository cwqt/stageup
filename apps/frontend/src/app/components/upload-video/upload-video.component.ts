import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AssetType, ICreateAssetRes } from '@core/interfaces';
import { createUpload, UpChunk } from '@mux/upchunk';
import { cachize, createICacheable, ICacheable } from '../../app.interfaces';
import { ToastService } from '../../services/toast.service';
import { ThemeKind } from '../../ui-lib/ui-lib.interfaces';
import { PlayerComponent } from '../player/player.component';

export type UpChunkEvents = 'success' | 'error' | 'progress';
const CHUNK_SIZE = 2048; // upload in 2mb chunks

@Component({
  selector: 'app-upload-video',
  templateUrl: './upload-video.component.html',
  styleUrls: ['./upload-video.component.scss']
})
export class UploadVideoComponent implements OnInit {
  @Input() initialSource: string; // url for initial value
  @Input() createAssetResHandler: () => Promise<ICreateAssetRes>;
  @Output() uploadChange: EventEmitter<UpChunkEvents> = new EventEmitter();

  @ViewChild('fileSelector') fileSelector: ElementRef;
  @ViewChild('livePlayer') livePlayer: PlayerComponent;
  @ViewChild('localPlayer') localPlayer: ElementRef;

  selectedVideo: File;
  assetCreateReq: ICacheable<ICreateAssetRes> = createICacheable();
  uploadAsset: ICacheable<UpChunk> = createICacheable(null, { upload_percent: 0 });
  uploadComplete:boolean;

  constructor(private toast:ToastService) {}

  ngOnInit() {}

  onPlayerReady(player:PlayerComponent) {
    if(this.initialSource)
      player.load({
        location: this.initialSource,
        _id: "",
        type: AssetType.Video
      });
  }

  onVideoSelected() {
    this.selectedVideo = this.fileSelector.nativeElement.files[0];
    const url = URL.createObjectURL(this.selectedVideo);
    this.localPlayer.nativeElement.src = url;
  }

  clearSelection() {
    this.selectedVideo = null;
  }

  async uploadVideo() {
    this.uploadComplete = false;
    this.uploadAsset.loading = true;

    // request the signed one time url to upload the video to MUX
    await cachize(this.createAssetResHandler(), this.assetCreateReq)
      .catch(e => {
        this.uploadAsset.error = e.message;
        this.uploadAsset.loading = false;
      })

    // start uploading in chunks using upchunk :)
    const upload = createUpload({
      endpoint: this.assetCreateReq.data.upload_url,
      file: this.selectedVideo,
      chunkSize: CHUNK_SIZE
    });

    // handle all the events
    upload.on('success', event => {
      this.uploadComplete = true;
      this.uploadChange.emit('success');
      // reset the state
      this.uploadAsset = createICacheable(null, { upload_percent: 0 });
      this.assetCreateReq = createICacheable();
      this.selectedVideo = null;
      this.toast.emit("Upload complete! Changes may take a few minutes to propagate...", ThemeKind.Primary)
    });

    upload.on('error', event => {
      this.uploadAsset.error = event.detail.message;
      this.uploadChange.emit('error');
    });

    upload.on('progress', event => {
      this.uploadAsset.meta.upload_percent = Math.ceil(event.detail as number);
      this.uploadChange.emit('progress');
    });
  }

  canceUpload() {}
}
