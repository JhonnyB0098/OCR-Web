import { useEffect, useRef, useState } from 'react';
import * as core from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { createWorker } from 'tesseract.js';

const Home = () => {
  const [imageData, setImageData] = useState<null | string>(null);
  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUri = reader.result;
      setImageData(imageDataUri as string);
    };
    reader.readAsDataURL(file);
  };

  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('idle');
  const [ocrResult, setOcrResult] = useState('');

  const workerRef = useRef<Tesseract.Worker | null>(null);
  useEffect(() => {
    workerRef.current = createWorker({
      logger: message => {
        if ('progress' in message) {
          setProgress(message.progress);
          setProgressLabel(message.progress == 1 ? 'Done' : message.status);
        }
      }
    });
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    }
  }, []);

  const handleExtract = async () => {
    setProgress(0);
    setProgressLabel('starting');

    const worker = workerRef.current!;
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const response = await worker.recognize(imageData!);
    setOcrResult(response.data.text);
    console.log(response.data);
  };

  return (<>
    <core.Group align='initial' style={{ padding: '10px' }}>
      <core.Stack style={{ flex: '1' }}>
        <Dropzone
          onDrop={(files) => loadFile(files[0])}
          accept={IMAGE_MIME_TYPE}
          multiple={false}
        >{() => (
          <core.Text size="xl" inline>
            Drag image here or click to select file
          </core.Text>
        )}</Dropzone>

        {!!imageData && <core.Image src={imageData} style={{ width: '100%' }} />}
      </core.Stack>

      <core.Stack style={{ flex: '1' }}>
        <core.Button disabled={!imageData || !workerRef.current} onClick={handleExtract}>Extract</core.Button>
        <core.Text>{progressLabel.toUpperCase()}</core.Text>
        <core.Progress value={progress * 100} />

        {!!ocrResult && <core.Stack>
          <core.Text size='xl'>RESULT</core.Text>
          <core.Text style={{ fontFamily: 'monospace', background: 'black', padding: '10px' }}>{ocrResult}</core.Text>
        </core.Stack>}
      </core.Stack>
    </core.Group>
  </>);
}

export default Home;