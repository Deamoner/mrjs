import { MRUIEntity } from '../../UI/UIEntity'
import { Entity } from '../../core/entity'
import { Column } from './Column'

export class Row extends MRUIEntity {


  constructor() {
    super()
    this.shuttle = new THREE.Group() // will shift based on bounding box width
    this.object3D.userData.bbox = new THREE.Box3()
    this.object3D.userData.size = new THREE.Vector3()
    this.object3D.add(this.shuttle)
    this.columns = 0
    this.accumulatedX = 0

    document.addEventListener('container-mutated', (event) => {
      if (event.target != this.closest('mr-container')) { return }
      this.update()
    })

    this.currentPosition = new THREE.Vector3()
    this.prevPosition = new THREE.Vector3()
    this.delta = new THREE.Vector3()
  }

  update = () => {
    this.getColumnCount()
    const children = Array.from(this.children)
    this.accumulatedX = 0
    for (const index in children) {
        let child = children[index]
        if (!(child instanceof Column)) { continue }

        this.accumulatedX += child.margin.left
        child.object3D.position.setX( this.accumulatedX + child.width / 2)
        this.accumulatedX += child.width
        this.accumulatedX += child.margin.right
    }
    this.shuttle.position.setX(-this.parentElement.width / 2)
    }

  add(entity) {
    this.shuttle.add(entity.object3D)
    this.update()
  }

  remove(entity) {
    this.shuttle.remove(entity.object3D)
    this.update()
  }

  getColumnCount(){
    const children = Array.from(this.children)
    this.columns = 0
    for (const child of children) {
        if (!child instanceof Entity) { continue }
        this.columns += child.width + child.margin.horizontal
    }
  }
}

customElements.get('mr-row') || customElements.define('mr-row', Row)
