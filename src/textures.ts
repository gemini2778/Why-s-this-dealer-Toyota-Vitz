import * as T from 'three';

function canvasTexture(w:number,h:number,paint:(c:CanvasRenderingContext2D)=>void) {
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  paint(canvas.getContext('2d')!);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=4;return texture;
}

export function createTextures() {
  const plate=canvasTexture(512,128,c=>{
    c.fillStyle='#efeee6';c.fillRect(0,0,512,128);
    c.strokeStyle='#aaa99f';c.lineWidth=5;c.strokeRect(5,5,502,118);
    c.fillStyle='#263431';c.font='bold 65px Arial';c.textAlign='center';c.fillText('V I T Z',256,91);
    for(const x of [25,487]){c.fillStyle='#777e7e';c.beginPath();c.arc(x,24,4,0,Math.PI*2);c.fill();}
  });
  const meter=canvasTexture(512,128,c=>{
    c.fillStyle='#070d0d';c.fillRect(0,0,512,128);
    c.fillStyle='#8fd2b3';c.font='bold 75px Consolas,monospace';c.textAlign='right';c.fillText('0',325,91);
    c.font='17px Arial';c.fillText('km/h',410,89);c.textAlign='left';c.fillText('P',28,75);
    c.fillStyle='#647e74';c.font='17px Consolas';c.fillText('E ▪▪▪▪ F',55,109);c.fillText('ODO  1999',338,112);
    c.strokeStyle='#568772';c.lineWidth=3;c.strokeRect(48,23,130,11);
  });
  // Woven yarn alternates warp and weft. Keep the fine bump separate so
  // the large irregular insert motifs are color only, as on dyed cloth.
  function weave(c:CanvasRenderingContext2D,size:number,bump=false){
    const data=c.createImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const warp=((x>>1)+(y>>1))%2===0,fibre=(warp?x:y)%2===0?1:-1;
      const thread=((x*27+y*43+(x*y)%77)%19-9)/9;
      const v=bump?128+28*fibre+13*thread:186+6*fibre+9*thread;
      const i=(y*size+x)*4;
      data.data[i]=v;data.data[i+1]=v+(bump?0:2);data.data[i+2]=v+(bump?0:4);data.data[i+3]=255;
    }
    c.putImageData(data,0,0);
  }
  const fabric=canvasTexture(256,256,c=>weave(c,256));
  fabric.wrapS=fabric.wrapT=T.RepeatWrapping;fabric.repeat.set(4,4);
  const fabricWeave=canvasTexture(256,256,c=>weave(c,256,true));
  fabricWeave.colorSpace=T.NoColorSpace;fabricWeave.wrapS=fabricWeave.wrapT=T.RepeatWrapping;
  fabricWeave.repeat.set(3,3);
  const fabricInsert=canvasTexture(384,384,c=>{
    weave(c,384);
    let seed=21899;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    c.lineCap='round';
    for(let i=0;i<62;i++){
      const x=random()*384,y=random()*384,angle=random()*Math.PI*2,scale=.56+.65*random();
      const tone=i%5===0?92:232;
      for(const dx of [-384,0,384])for(const dy of [-384,0,384]){
        if(x+dx<-25||x+dx>409||y+dy<-25||y+dy>409)continue;
        c.save();c.translate(x+dx,y+dy);c.rotate(angle);c.scale(scale,scale);
        c.strokeStyle=`rgba(${tone},${tone+4},${tone+7},.20)`;
        c.lineWidth=i%4===0?2.5:1.65;c.beginPath();
        if(i%3===0){c.moveTo(-9,-8);c.bezierCurveTo(-3,9,4,10,10,-3);}
        else if(i%3===1){c.moveTo(-8,-5);c.bezierCurveTo(5,-11,8,-3,4,5);c.quadraticCurveTo(0,9,7,12);}
        else{c.moveTo(-7,-7);c.quadraticCurveTo(-9,0,1,1);c.quadraticCurveTo(9,2,11,9);}
        c.stroke();c.restore();
      }
    }
  });
  fabricInsert.wrapS=fabricInsert.wrapT=T.RepeatWrapping;
  const radio=canvasTexture(768,160,c=>{
    c.fillStyle='#30383b';c.fillRect(0,0,768,160);
    c.fillStyle='#667c77';c.fillRect(135,25,480,55);
    c.fillStyle='#182927';c.font='33px Consolas';c.fillText('FM  87.5    ST',161,66);
    c.fillStyle='#b6bdc0';c.font='16px Arial';c.fillText('TOYOTA',31,25);c.fillText('TUNE',650,76);
    for(let i=0;i<6;i++){
      c.fillStyle='#20292d';c.fillRect(145+i*76,104,60,31);c.fillStyle='#b7bfc2';c.font='15px Arial';c.fillText(String(i+1),171+i*76,125);
    }
    c.fillStyle='#111a1c';c.fillRect(137,88,479,4);
  });
  const hvac=canvasTexture(900,285,c=>{
    c.lineWidth=5;c.font='18px Arial';c.textAlign='center';
    for(const x of [150,450,750]){
      c.strokeStyle='#c0c9ca';c.beginPath();c.arc(x,143,94,Math.PI*1.05,Math.PI*1.95);c.stroke();
      for(let i=0;i<=8;i++){
        const a=Math.PI*1.05+i*Math.PI*.9/8;
        c.beginPath();c.moveTo(x+Math.cos(a)*95,143+Math.sin(a)*95);c.lineTo(x+Math.cos(a)*103,143+Math.sin(a)*103);c.stroke();
      }
    }
    c.strokeStyle='#5787a5';c.lineWidth=9;c.beginPath();c.arc(150,143,94,Math.PI*1.05,Math.PI*1.5);c.stroke();
    c.strokeStyle='#bc6359';c.beginPath();c.arc(150,143,94,Math.PI*1.5,Math.PI*1.95);c.stroke();
    c.fillStyle='#c0c9ca';c.fillText('TEMP',150,265);c.fillText('OFF  1  2  3  4',450,265);c.fillText('AIR FLOW',750,265);
  });
  const audio=canvasTexture(768,144,c=>{
    c.fillStyle='#202b2f';c.fillRect(0,0,768,144);c.fillStyle='#5a756d';c.fillRect(140,24,434,42);
    c.fillStyle='#c0d4bd';c.font='26px Consolas';c.fillText('CD  01    00:00',164,54);
    c.fillStyle='#101719';c.fillRect(150,78,405,8);c.fillStyle='#9eacb0';c.font='17px Arial';
    c.fillText('VOL',26,51);c.fillText('COMPACT DISC',292,123);
    for(const x of [40,83,606,650,694]){c.fillStyle='#6c7b7f';c.fillRect(x,95,26,16);}
  });
  const shift=canvasTexture(128,512,c=>{
    c.fillStyle='#293236';c.fillRect(0,0,128,512);c.fillStyle='#c5ccca';c.font='bold 43px Arial';c.textAlign='center';
    for(const [i,s] of ['P','R','N','D','2','L'].entries()){c.fillStyle=i===2?'#81a490':'#c5ccca';c.fillText(s,64,62+i*78);}
  });
  const engine=canvasTexture(640,256,c=>{
    c.strokeStyle='#e8e9e3';c.lineWidth=5;
    for(const [rx,ry,y] of [[47,29,56],[13,28,56],[36,11,48]]){c.beginPath();c.ellipse(320,y,rx,ry,0,0,Math.PI*2);c.stroke();}
    c.fillStyle='#e8e9e3';c.textAlign='center';
    c.font='bold italic 91px Arial';c.fillText('VVT-i',320,164);
  });
  return {plate,meter,fabric,fabricInsert,fabricWeave,radio,hvac,audio,shift,engine};
}
