declare module "qz-tray" {
  interface QzTray {
    websocket: {
      isActive(): boolean
      connect(options?: Record<string, unknown>): Promise<void>
    }
    configs: {
      create(printer: string, options?: Record<string, unknown>): unknown
    }
    print(config: unknown, data: unknown): Promise<void>
  }
  const qz: QzTray
  export default qz
}
