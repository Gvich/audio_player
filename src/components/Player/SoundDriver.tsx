import Drawer from './Drawer';

class SoundDriver {
    private readonly audiFile;

    private drawer?: Drawer;

    private context: AudioContext;

    private gainNode?: GainNode = undefined; // sound volume controller

    private audioBuffer?: AudioBuffer = undefined;

    private bufferSource?: AudioBufferSourceNode = undefined; // audio buffer source, to play the sound

    private startedAt = 0;

    private pausedAt = 0;

    private isRunning = false;

    private volume: number = 1; // Add volume state

    constructor(audioFile: Blob) {
        this.audiFile = audioFile;
        this.context = new AudioContext();
    }

    static showError(error: string) {
        alert(
            'SoundParser constructor error. Can not read audio file as ArrayBuffer'
        );
        return error;
    }

    public init(parent: HTMLElement | null) {
        return new Promise((resolve, reject) => {
            if (!parent) {
                reject(new Error('Parent element not found'));
                return;
            }

            const reader = new FileReader();
            reader.readAsArrayBuffer(this.audiFile);
            reader.onload = (event: ProgressEvent<FileReader>) =>
                this.loadSound(event).then(buffer => {
                    this.audioBuffer = buffer;
                    this.drawer = new Drawer(buffer, parent);
                    resolve(undefined);
                });
            reader.onerror = reject;
        });
    }

    private loadSound(readerEvent: ProgressEvent<FileReader>) {
        if (!readerEvent?.target?.result) {
            throw new Error('Can not read file');
        }

        return this.context.decodeAudioData(
            readerEvent.target.result as ArrayBuffer
        );
    }

    public async play() {
        if (!this.audioBuffer) {
            throw new Error(
                'Play error. Audio buffer does not exist. Try calling loadSound before Play.'
            );
        }

        if (this.isRunning) {
            return;
        }

        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = this.getVolume(); // Access the volume value


        this.bufferSource = this.context.createBufferSource();
        this.bufferSource.buffer = this.audioBuffer;

        this.bufferSource.connect(this.gainNode);
        this.bufferSource.connect(this.context.destination);

        this.gainNode.connect(this.context.destination);

        await this.context.resume();
        this.bufferSource.start(0, this.pausedAt);

        this.startedAt = this.context.currentTime - this.pausedAt;
        this.pausedAt = 0;

        this.isRunning = true;
    }

    public async pause(reset?: boolean) {
        if (!this.bufferSource || !this.gainNode) {
            throw new Error(
                'Pause - bufferSource does not exist. Maybe you forgot to call Play before?'
            );
        }

        await this.context.suspend();

        this.pausedAt = reset ? 0 : this.context.currentTime - this.startedAt;
        this.bufferSource.stop(this.pausedAt);
        this.bufferSource.disconnect();
        this.gainNode.disconnect();

        this.isRunning = false;
    }

    public changeVolume(volume: number) {
        if (!this.gainNode) {
            return;
        }

        this.gainNode.gain.value = volume;
        this.volume = volume; // Update volume state
    }

    public drawChart() {
        this.drawer?.init();
    }

    public getVolume() {
        return this.volume; // Add getter method for volume state
    }
}

export default SoundDriver;
