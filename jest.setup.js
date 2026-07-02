import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.Request = class Request {}
global.Response = class Response {}
global.fetch = jest.fn()
