import { Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { isString } from '@tethys/cdk';
import Cropper from 'cropperjs';
import { thyCropDataChangeEvent, ThyCropperOptions, ThyCropperViewMode } from './cropper.entity';

@Component({
    selector: 'thy-image-cropper',
    templateUrl: './cropper.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ThyImageCropperComponent implements OnInit {
    @HostBinding('class.thy-image-cropper') cropperClass = true;

    @ViewChild('image', { static: true }) image!: ElementRef;

    /**
     * 图片资源
     */
    @Input('thyImage') set imageSource(value: File | string) {
        if (!isString(value)) {
            this.imageFile = value;
            this.setImageSrc();
        } else {
            this.imageSrc = value;
        }
    }

    /**
     * 图片加载的错误提示
     * @default 图片加载错误
     */
    @Input() thyImageErrorMessage: string = '图片加载错误';

    /**
     * 图片裁剪模式
     */
    @Input() thyCropperViewMode!: ThyCropperViewMode;

    /**
     * 图片裁剪宽高比
     */
    @Input() thyCropperAspectRatio!: number;

    /**
     * 图片裁剪的数据更改(blob)
     * @default EventEmitter<thyCropDataChangeEvent>
     */
    @Output() thyCropDataChanged: EventEmitter<thyCropDataChangeEvent> = new EventEmitter<thyCropDataChangeEvent>();

    /**
     * 图片加载完毕事件
     * @default EventEmitter<boolean>
     */
    @Output() thyImageReady: EventEmitter<boolean> = new EventEmitter<boolean>();

    public loadingDone = false;

    public cropper: Cropper | undefined;

    public loadError: boolean = false;

    // 图片文件
    private imageFile!: File;

    // 图片资源的url
    public imageSrc!: string;

    defaultCropperOptions: ThyCropperOptions = {
        viewMode: 2,
        aspectRatio: 1,
        movable: false,
        scalable: false,
        dragMode: 'move' as Cropper.DragMode,
        cropBoxResizable: false,
        zoomable: true,
        guides: false,
        autoCrop: false,
        zoomOnWheel: true,
        checkCrossOrigin: true,
        preview: '.preview-image-warp',
        ready: (event) => {
            this.loadingDone = true;
            (this.cropper as Cropper).crop();
            return;
        }
    };

    cropperOptions!: ThyCropperOptions;

    constructor() {}

    ngOnInit() {}

    onLoad(event: Event) {
        this.loadError = false;

        const image = event.target as HTMLImageElement;

        image.addEventListener('ready', () => {
            this.thyImageReady.emit(true);
        });

        const { viewMode, aspectRatio } = this.defaultCropperOptions;

        const customCropperOptions = {
            viewMode: this.thyCropperViewMode || this.thyCropperViewMode === 0 ? this.thyCropperViewMode : viewMode,
            aspectRatio: this.thyCropperAspectRatio ? this.thyCropperAspectRatio : aspectRatio
        };

        this.cropperOptions = Object.assign(
            {
                ...this.defaultCropperOptions,
                crop: (event: any) => {
                    this.crop();
                }
            },
            customCropperOptions
        );

        if (this.cropperOptions?.checkCrossOrigin) {
            image.crossOrigin = 'anonymous';
        }

        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = undefined;
        }
        this.cropper = new Cropper(image, this.cropperOptions);
    }

    onError(event: Event) {
        this.loadError = true;
        this.loadingDone = true;
    }

    crop = () => {
        const cropper = this.cropper as Cropper;
        const canvas = cropper.getCroppedCanvas();
        const promise = new Promise((resolve) => {
            canvas.toBlob((blob) => resolve({ blob }));
        });

        promise.then((res) => {
            return this.thyCropDataChanged.emit(res as thyCropDataChangeEvent);
        });
    };

    setImageSrc() {
        const reader = new FileReader();
        reader.onloadend = () => {
            const cropperRef = this.cropper;
            if (cropperRef) {
                cropperRef.destroy();
                cropperRef.replace((reader.result as ArrayBuffer).toString(), true);
                cropperRef.reset();
            }
            this.imageSrc = (reader.result as ArrayBuffer).toString();
        };
        if (this.imageFile) {
            reader.readAsDataURL(this.imageFile);
        } else {
            this.imageSrc = '';
        }
    }
}
