import { describe, it, expect } from 'vitest'
import { parsePath } from '../src/router'
import fs from 'fs'
import path from 'path'

describe('SEO Architecture, Sitemap & Router Verification', () => {
  it('correctly parses language routes and assigns SEO metadata', () => {
    const pythonRoute = parsePath('/python')
    expect(pythonRoute.route).toBe('python')
    expect(pythonRoute.language).toBe('python')
    expect(pythonRoute.title).toContain('Python 3.12')

    const cRoute = parsePath('/c')
    expect(cRoute.route).toBe('c')
    expect(cRoute.language).toBe('c')
    expect(cRoute.title).toContain('C Compiler')

    const cppRoute = parsePath('/cpp')
    expect(cppRoute.route).toBe('cpp')
    expect(cppRoute.language).toBe('cpp')
    expect(cppRoute.title).toContain('C++')

    const javaRoute = parsePath('/java')
    expect(javaRoute.route).toBe('java')
    expect(javaRoute.language).toBe('java')
    expect(javaRoute.title).toContain('Java')

    const jsRoute = parsePath('/javascript')
    expect(jsRoute.route).toBe('javascript')
    expect(jsRoute.language).toBe('javascript')
    expect(jsRoute.title).toContain('JavaScript')

    const featuresRoute = parsePath('/features')
    expect(featuresRoute.route).toBe('features')

    const faqRoute = parsePath('/faq')
    expect(faqRoute.route).toBe('faq')

    const templatesRoute = parsePath('/templates')
    expect(templatesRoute.route).toBe('templates')

    const homeRoute = parsePath('/')
    expect(homeRoute.route).toBe('compiler')
  })

  it('verifies sitemap.xml exists and contains valid URLs for all 5 languages and sub-pages', () => {
    const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml')
    expect(fs.existsSync(sitemapPath)).toBe(true)

    const content = fs.readFileSync(sitemapPath, 'utf-8')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/python</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/c</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/cpp</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/java</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/javascript</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/features</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/faq</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/templates</loc>')
    expect(content).toContain('<loc>https://yourcodebase.vercel.app/docs</loc>')
  })

  it('verifies robots.txt exists and points to the sitemap', () => {
    const robotsPath = path.resolve(__dirname, '../public/robots.txt')
    expect(fs.existsSync(robotsPath)).toBe(true)

    const content = fs.readFileSync(robotsPath, 'utf-8')
    expect(content).toContain('User-agent: *')
    expect(content).toContain('Sitemap: https://yourcodebase.vercel.app/sitemap.xml')
  })

  it('verifies web app manifest.json exists with language shortcuts', () => {
    const manifestPath = path.resolve(__dirname, '../public/manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(true)

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    expect(manifest.name).toContain('CodeSpace')
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(5)
  })

  it('verifies index.html has JSON-LD structured data for WebApplication and FAQPage', () => {
    const htmlPath = path.resolve(__dirname, '../index.html')
    expect(fs.existsSync(htmlPath)).toBe(true)

    const html = fs.readFileSync(htmlPath, 'utf-8')
    expect(html).toContain('"@type": "WebApplication"')
    expect(html).toContain('"@type": "FAQPage"')
    expect(html).toContain('og:image')
    expect(html).toContain('twitter:card')
    expect(html).toContain('rel="canonical"')
  })
})
