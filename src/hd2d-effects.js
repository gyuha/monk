import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// One scene/depth render, then actual depth-aware lens blur and HDR bloom.
// Keeping the alpha-tested actors in the normal depth pass preserves their outlines.
export class HD2DEffects {
  constructor(renderer,scene,camera){
    this.renderer=renderer;this.scene=scene;this.camera=camera;
    this.target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthTexture:new THREE.DepthTexture(1,1,THREE.UnsignedIntType)});
    this.target.samples=0;
    this.composer=new EffectComposer(renderer);
    this.dof=new ShaderPass({
      uniforms:{sceneColor:{value:null},sceneDepth:{value:null},resolution:{value:new THREE.Vector2(1,1)},nearClip:{value:camera.near},farClip:{value:camera.far},focus:{value:30},aperture:{value:.62}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`
        #include <packing>
        varying vec2 vUv;
        uniform sampler2D sceneColor,sceneDepth;
        uniform vec2 resolution;
        uniform float nearClip,farClip,focus,aperture;
        void main(){
          float depth=texture2D(sceneDepth,vUv).x;
          float distance=-perspectiveDepthToViewZ(depth,nearClip,farClip);
          float radius=min(6.0,max(0.0,abs(distance-focus)-3.5)*aperture);
          vec4 sum=texture2D(sceneColor,vUv)*4.0;
          for(int i=0;i<16;i++){
            float angle=float(i)*2.39996323;
            float r=sqrt((float(i)+.5)/16.0)*radius;
            vec2 uv=vUv+vec2(cos(angle),sin(angle))*r/resolution;
            sum+=texture2D(sceneColor,uv);
          }
          vec3 color=sum.rgb/20.0;
          // Very mild lens falloff; HUD stays outside this pass.
          color*=1.0-.13*smoothstep(.25,.76,length((vUv-.5)*vec2(1.0,.85)));
          gl_FragColor=vec4(color,1.0);
        }`,
    },'unused');
    this.dof.uniforms.sceneColor.value=this.target.texture;this.dof.uniforms.sceneDepth.value=this.target.depthTexture;
    this.bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.25,.55,1.05);
    this.composer.addPass(this.dof);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.enabled=true;
  }
  resize(w,h){const ratio=this.renderer.getPixelRatio();this.target.setSize(w*ratio,h*ratio);this.composer.setPixelRatio(ratio);this.composer.setSize(w,h);this.dof.uniforms.resolution.value.set(w*ratio,h*ratio);}
  render(focusPoint,night=false){
    if(!this.enabled){this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);return;}
    const point=focusPoint.clone().applyMatrix4(this.camera.matrixWorldInverse);
    this.dof.uniforms.focus.value=-point.z;this.bloom.strength=night?.38:.22;
    this.renderer.setRenderTarget(this.target);this.renderer.clear();this.renderer.render(this.scene,this.camera);this.renderer.setRenderTarget(null);this.composer.render();
  }
  dispose(){this.target.dispose();this.dof.dispose();this.bloom.dispose();this.composer.dispose();}
}
